import asyncio
import psutil
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from app.schemas.command import (
    CommandInterpretRequest, CommandIntent,
    CommandValidateRequest, ValidationResult,
    CommandExecuteRequest, ExecutionResult,
    ProcessItem, JobItem, HistoryItem, SystemStats,
    TraceResult, FileItem,
    ExplainRequest, ExplainResponse
)
from app.services.intent_service import IntentService
from app.services.explain_service import ExplainService
from app.services.safety_service import SafetyService
from app.services.engine_service import EngineService
from app.services.process_service import ProcessService
from app.services.trace_service import TraceService
from app.services.file_service import FileService
from app.services.history_service import HistoryService

router = APIRouter()

@router.post("/explain", response_model=ExplainResponse)
async def explain_command(payload: ExplainRequest):
    return await ExplainService.explain(payload.query, payload.level)

@router.post("/command/interpret", response_model=CommandIntent)
async def interpret_command(payload: CommandInterpretRequest):
    return await IntentService.interpret(payload.natural_request)

@router.post("/command/validate", response_model=ValidationResult)
async def validate_command(payload: CommandValidateRequest):
    return SafetyService.validate(payload.command)

@router.post("/command/execute", response_model=ExecutionResult)
async def execute_command(payload: CommandExecuteRequest):
    validation = SafetyService.validate(payload.command)
    if validation.safety_level == "BLOCKED":
        raise HTTPException(status_code=400, detail=validation.reason)

    res = EngineService.execute_command(payload.command)

    # Save to history DB
    HistoryService.add(HistoryItem(
        user_request=payload.natural_request or payload.command,
        generated_command=payload.command,
        timestamp="",
        status=res.status,
        exit_code=res.exit_code,
        working_directory=res.working_directory
    ))

    return res

@router.post("/command/cancel")
async def cancel_command():
    return {"status": "cancelled", "message": "Execution cancelled"}

@router.get("/processes", response_model=List[ProcessItem])
async def get_processes():
    return ProcessService.get_processes()

@router.get("/processes/{pid}", response_model=ProcessItem)
async def get_process(pid: int):
    procs = ProcessService.get_processes()
    for p in procs:
        if p.pid == pid:
            return p
    raise HTTPException(status_code=404, detail=f"Process {pid} not found")

@router.post("/processes/{pid}/signal")
async def send_process_signal(pid: int, signal: int = 15):
    success = ProcessService.send_signal(pid, signal)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to send signal {signal} to PID {pid}")
    return {"status": "success", "pid": pid, "signal": signal}

@router.get("/jobs", response_model=List[JobItem])
async def get_jobs():
    return [
        JobItem(job_id=1, pid=1042, pgid=1042, command="sleep 10 &", state="RUNNING", exit_status=0)
    ]

@router.post("/jobs/{job_id}/foreground")
async def job_to_foreground(job_id: int):
    return {"status": "foregrounded", "job_id": job_id}

@router.post("/jobs/{job_id}/background")
async def job_to_background(job_id: int):
    return {"status": "backgrounded", "job_id": job_id}

@router.get("/history", response_model=List[HistoryItem])
async def get_history():
    return HistoryService.get_all()

@router.post("/history", response_model=HistoryItem)
async def add_history(item: HistoryItem):
    return HistoryService.add(item)

@router.delete("/history/{item_id}")
async def delete_history(item_id: int):
    success = HistoryService.delete(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {"status": "deleted", "id": item_id}

@router.get("/system/stats", response_model=SystemStats)
async def get_system_stats():
    mem = psutil.virtual_memory()
    procs = ProcessService.get_processes()
    return SystemStats(
        cpu_percent=psutil.cpu_percent(interval=0.1),
        memory_percent=mem.percent,
        memory_used_mb=round(mem.used / (1024 * 1024), 2),
        memory_total_mb=round(mem.total / (1024 * 1024), 2),
        active_processes=len(procs),
        active_jobs=1,
        kernel="Linux 6.6.137-microsoft-standard-WSL2",
        architecture="x86_64",
        hostname="shellforge-dev",
        uptime_seconds=86400.0
    )

@router.post("/trace", response_model=TraceResult)
async def trace_command(payload: CommandExecuteRequest):
    return TraceService.trace_command(payload.command)

@router.get("/files", response_model=List[FileItem])
async def list_files(path: str = ""):
    return FileService.list_files(path)

@router.websocket("/ws/execute")
async def ws_execute(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        await websocket.send_json({"type": "status", "data": "RUNNING", "pid": 1234})
        await asyncio.sleep(0.3)
        
        res = EngineService.execute_command(data)
        for line in res.stdout.splitlines():
            await websocket.send_json({"type": "stdout", "data": line})
            await asyncio.sleep(0.05)
            
        await websocket.send_json({
            "type": "completed",
            "exit_code": res.exit_code,
            "pid": res.pid,
            "ppid": res.ppid,
            "execution_time": res.execution_time
        })
    except WebSocketDisconnect:
        pass
