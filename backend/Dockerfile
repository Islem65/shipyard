# Utiliser une image de base qui contient Python 3.12
# python:3.12 : contient Python 3.12 avec davantage d'outils et de composants système.
#python:3.12-slim : contient Python 3.12 avec un ensemble plus réduit de composants, suffisant pour beaucoup d'applications.
FROM python:3.12-slim
#choisir le dossier dans lequel Docker va travailler à l'intérieur de l'image
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000
#CMD indique à Docker comment démarrer ton application. Ici, il lance Uvicorn, qui sert ton API FastAPI sur le port 8000.

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]