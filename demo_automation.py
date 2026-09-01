import asyncio
from playwright.async_api import async_playwright

async def run_demo():
    async with async_playwright() as p:
        # Launch browser in non-headless mode so you can see it happening
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        
        print("Navigate to the frontend app...")
        await page.goto("http://localhost:5173")
        
        print("Typing natural language request...")
        # Locate the input field
        input_locator = page.locator('input[placeholder="e.g. Find all C files, show detailed files, show current directory..."]')
        await input_locator.fill("Install mongodb")
        
        print("Clicking 'Translate Intent'...")
        translate_btn = page.locator('button:has-text("Translate Intent")')
        await translate_btn.click()
        
        print("Waiting for translation to finish...")
        # Wait for the "Generated Command:" block to appear
        await page.wait_for_selector('text=Generated Command:', state='visible')
        
        print("Clicking 'Execute'...")
        execute_btn = page.locator('button:has-text("Execute")')
        await execute_btn.click()
        
        print("Waiting for execution to complete...")
        # Wait for the execution status indicator in the terminal window to show Exit Code
        await page.wait_for_selector('text=Exit Code:', state='visible', timeout=10000)
        
        print("Demo complete! Leaving browser open for 10 seconds...")
        await asyncio.sleep(10)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_demo())
