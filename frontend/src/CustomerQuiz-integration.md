# Integrar el cuestionario individual

1. Copia `CustomerQuiz.tsx` y `CustomerQuiz.css` a la misma carpeta donde tienes `App.tsx` (por ejemplo, `src/`).
2. En `App.tsx`, agrega este import junto a los imports existentes:

```tsx
import CustomerQuiz from "./CustomerQuiz";
```

3. Dentro del bloque `screen === "home" ? (...) : (...)`, conserva el botón **Back to workspace** que ya tienes y reemplaza solamente la sección `<section className="quiz-placeholder"> ... </section>` con:

```tsx
<CustomerQuiz />
```

4. En `CustomerQuiz.tsx`, verifica `PREDICT_URL`. Está configurada como `http://localhost:8000/predict` y presupone que FastAPI acepta un objeto JSON plano con los 13 nombres de columna exactos.

El frontend manda valores numéricos como números y conserva exactamente los nombres `Satisfaction Score`, `Card Type` y `Point Earned`. El componente reconoce respuestas comunes como `{"prediction": 1, "probability": 0.72}` o `{"Exited": 0, "churn_probability": 0.12}`; si tu endpoint devuelve otro esquema, adapta `normalizePrediction()` a esa respuesta.
