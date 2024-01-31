# Use the official Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the application files to the container
COPY . /app

# Install dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Expose the port that Gunicorn will run on
EXPOSE 8080

# Command to run the application using Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "backend.app:app"]

