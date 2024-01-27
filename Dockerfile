FROM python:3.11.2

WORKDIR /Users/ssd/Desktop/Hangman/

COPY ./backend /Users/ssd/Desktop/Hangman/backend
COPY ./frontend /Users/ssd/Desktop/Hangman/frontend
COPY .requirements.txt /Users/ssd/Desktop/Hangman/backend/requirements.txt

RUN pip install --upgrade pip

RUN pip install torch torchvision opencv-python
RUN pip install -r requirements.txt

RUN echo "building..."

ENV FLASK_APP "apps.app:create_app('local')"
ENV IMAGE_URL "/storage/images"

EXPOSE 5000

CMD ["flask", "run", "-h", "0.0.0.0"]