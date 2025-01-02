import { fromAnyIterable } from "@sec-ant/readable-stream/ponyfill/fromAnyIterable";
import { type Html, html, renderHtmlStream } from "@thai/html";

export async function pageResponse(title: string, body: Html) {
  const stream = renderHtmlStream(html`<!DOCTYPE html>
    <html lang="en" data-bs-theme="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossorigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
        <style>
          :root {
            --bs-font-sans-serif: Arimo, Helvetica, Arial, system-ui,
              -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans",
              "Liberation Sans", Arial, sans-serif, "Apple Color Emoji",
              "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            --bs-body-bg: #353433;
            --bs-secondary-color: #8b8685;
            letter-spacing: 0.04ch;
          }
          body {
            -webkit-font-smoothing: antialiased;
          }
          .text-name {
            color: #bbeeff;
          }
          .text-emphasis {
            color: #d7fc70;
          }
        </style>
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
          crossorigin="anonymous"
        ></script>
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/wc-qrcode@0.1.6"
        ></script>
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/iconify-icon@2.2.0/dist/iconify-icon.min.js"
        ></script>
      </head>
      <body>
        <div class="p-4" style="margin: 0 auto; max-width: 480px;">${body}</div>
      </body>
    </html>`);
  return new Response(fromAnyIterable(stream), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
