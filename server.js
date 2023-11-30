import express from "express";
/**
 * Función para poder desplegar el proyecto en replit.
 * @returns { void }
 */
export function keepAlive() {
  const app = express();

  app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
    <html>
    <head>
        <title>Servidor</title>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                text-align: center;
                font-family: 'Roboto', sans-serif;
            }
            p {
                font-size: 24px;
            }
            img {
                max-width: 50%;
                height: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Servidor en línea correctamente</p>
            <img src="https://media.tenor.com/Pi7beezalFkAAAAi/spinning.gif">
        </div>
    </body>
    </html>`);
  });

  app.listen(10000, () => console.log("¡Server ready!"));
}
