# 📌 Playwright SII Bot

Este proyecto utiliza **Playwright** para automatizar el inicio de sesión en el **SII e-Boleta**, extraer tokens y abrir enlaces automáticamente.

## 🚀 Características
✅ Automatiza el inicio de sesión en el SII.  
✅ Extrae enlaces de `localStorage`.  
✅ Guarda los datos en un archivo `results.json`.  
✅ Compatible con múltiples RUTs desde `providers.json`.  

---

## 🛠️ Instalación

1️⃣ **Clona el repositorio**
```bash
git clone https://github.com/carlosvillalobosh/playwright-sii.git
cd playwright-sii
```

2️⃣ Instala las dependencias

```bash
npm install
```
3️⃣ Crea el archivo providers.json con los RUTs y contraseñas:

```json
[
  {
    "rut": "17988401-1",
    "pass": "tu_clave"
  },
  {
    "rut": "19026243-K",
    "pass": "otra_clave"
  }
]
```

🏃‍♂️ Uso
```bash
node index.js
```