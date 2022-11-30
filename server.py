import flask
import flask_socketio
from flask import request


keymap = {
    #    [left, right, back front]
    'f': [1, 1, 0, 0],      # forward
    'b': [-1, -1, 0, 0],    # backward
    'l': [-1, 1, 0, 0],     # left
    'r': [1, -1, 0, 0],     # right
    'u': [0, 0, 1, 1],      # up
    'd': [0, 0, -1, -1],    # down
}
keyList = ['f', 'b', 'l', 'r', 'u', 'd']

app = flask.Flask(__name__, static_url_path='', static_folder='static')
socketio = flask_socketio.SocketIO(app)

piReady = False
pisid = None

@app.route('/')
def index():
    return ""

@app.route('/control')
def control():
    return flask.render_template('control.html')

@app.route('/wii')
def wiipage():
    return flask.render_template('wiimote.html')

@socketio.on('connect')
def connect():
    print('Client connected')

@socketio.on('ready')
def readyup():
    print('Client is ready')
    pisid = request.sid
    socketio.emit('arm')

@socketio.on('armed')
def armed():
    global piReady
    print('Client is armed')
    piReady = True

@socketio.on('disconnect')
def disconnect():
    global piReady
    if request.sid == pisid:
        piReady = False
    print('Client disconnected')

@socketio.on('thrust')
def thrust(data):
    global motors
    if not piReady:
        return
    print('data:', data)
    # 6 bits, 1 for each
    motors = {
        'left': data[0],
        'right': data[1],
        'back': data[2],
        'front': data[3]
    }

    motors['left'] = min(1, max(-1, motors['left']))
    motors['right'] = min(1, max(-1, motors['right']))
    motors['back'] = min(1, max(-1, motors['back']))
    motors['front'] = min(1, max(-1, motors['front']))

    print(motors)

    socketio.emit('thrust', motors)

if __name__ == '__main__':
    socketio.run(app, host='169.254.46.102', port=3000, debug=True, ssl_context='adhoc')
    # socketio.run(app, host='169.254.46.102', port=3000, debug=True)
    # socketio.run(app, host='0.0.0.0', port=8000, debug=True, ssl_context='adhoc')term
    