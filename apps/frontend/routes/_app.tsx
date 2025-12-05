import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TALAE - Talking Avatar in a Living Artificial Environment</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
