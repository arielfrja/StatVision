import subprocess
import sys

def run_playwright():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not found. Attempting to install...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
        from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # The user said the server is already running and they have access to GUI.
        # I'll try port 3001 as per package.json.
        url = "http://localhost:3001"
        print(f"Connecting to {url}...")
        try:
            page.goto(url)
            page.wait_for_load_state("networkidle")
            print(f"Page Title: {page.title()}")
            page.screenshot(path="screenshot.png")
            print("Screenshot saved to screenshot.png")
        except Exception as e:
            print(f"Error connecting to {url}: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_playwright()
