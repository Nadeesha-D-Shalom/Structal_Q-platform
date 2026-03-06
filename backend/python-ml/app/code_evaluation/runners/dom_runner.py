import tempfile
import os
from playwright.sync_api import sync_playwright


class DOMRunner:

    def __init__(self, timeout_seconds: int = 5):
        self.timeout_seconds = timeout_seconds

    def execute(self, js_code: str, test_input: dict):

        try:
            with tempfile.TemporaryDirectory() as tmpdir:

                html_path = os.path.join(tmpdir, "index.html")

                html_content = self._generate_html(js_code)

                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(html_content)

                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page()

                    alert_message = {"text": ""}

                    def handle_dialog(dialog):
                        alert_message["text"] = dialog.message
                        dialog.dismiss()

                    page.on("dialog", handle_dialog)

                    page.goto(f"file:///{html_path}")

                    page.fill("#name", test_input.get("name", ""))
                    page.fill("#age", str(test_input.get("age", "")))
                    page.fill("#email", test_input.get("email", ""))
                    page.fill("#phone", test_input.get("phone", ""))

                    page.click("#submitBtn")

                    browser.close()

                    return alert_message["text"]

        except Exception:
            return ""

    def _generate_html(self, js_code: str):

        return f"""
        <!DOCTYPE html>
        <html>
        <body>

            <form id="form" onsubmit="return submitForm()">
                <input id="name" />
                <input id="age" />
                <input id="email" />
                <input id="phone" />
                <button id="submitBtn" type="submit">Submit</button>
            </form>

            <script>
            {js_code}
            </script>

        </body>
        </html>
        """


