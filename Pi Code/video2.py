# import required modules
from flask import Flask, render_template, Response
from io import BytesIO
import picamera
import numpy as np
from time import sleep

app = Flask(__name__)
my_stream = BytesIO()


@app.route('/')
def index():
  """Video streaming ."""
  return """<html>
<head>
  <title>Video Streaming </title>
</head>
<body>
  <h1> Live Video Streaming </h1>
  <img src="video_feed.jpeg">
</body>
</html> """
def gen(): 
  """Video streaming generator function.""" 
  while True: 
    with picamera.PiCamera(resolution='640x480', framerate=24) as camera:
      my_file = open('pic.jpg', 'wb')
      camera.capture(my_file)
      my_file.close()
    yield (b'--frame\r\n' 
              b'Content-Type: image/jpeg\r\n\r\n' + open('pic.jpg', 'rb').read() + b'\r\n') 
@app.route('/video_feed.jpeg')
def video_feed():
  """Video streaming route. Put this in the src attribute of an img tag."""
  return Response(gen(),
                  mimetype='multipart/x-mixed-replace; boundary=frame')
if __name__ == '__main__':
  app.run(host='0.0.0.0', debug=True, threaded=True)
