import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Capture console errors
        logs = []
        page.on("console", lambda msg: logs.append(f"CONSOLE {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: logs.append(f"PAGE ERROR: {err}"))
        
        await page.goto("http://localhost:8090/admin.html")
        await page.wait_for_timeout(2000)
        
        print("Clicking CS tab...")
        await page.click("text='신고 및 문의 관리 (CS)'")
        await page.wait_for_timeout(1000)
        
        print("Logs after click:")
        for log in logs:
            print(log)
            
        screenshot_path = "cs_tab_debug.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
