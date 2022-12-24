import os     #importing os library so as to communicate with the system
import time   #importing time library to make Rpi wait because its too impatient 
from motors import Motor
import socketio
import sys
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)

GPIO.setup(5, GPIO.IN) # sensor 1
GPIO.setup(6, GPIO.IN) # sensor 2

left_motor = Motor(4)
right_motor = Motor(17)
back_motor = Motor(27)
front_motor = Motor(22)

all_motors = [left_motor, right_motor, back_motor, front_motor]

def arm(): #This is the arming procedure of an ESC 
    for motor in all_motors:
        motor.thrust(0)
    time.sleep(1)
    for motor in all_motors:
        motor.thrust(1)
    time.sleep(1)
    for motor in all_motors:
        motor.thrust(-1)
    time.sleep(1)
    for motor in all_motors:
        motor.thrust(0)

sio = socketio.Client(ssl_verify=False)


@sio.on('connect')
def on_connect():
    print('connection established')
    # emit ready
    sio.emit('ready')

@sio.on('arm')
def on_arm():
    print('arming')
    arm()
    sio.emit('armed')

@sio.on('thrust')
def on_thrust(data):
    print(data)
    left_motor.thrust(data['left'])
    right_motor.thrust(data['right'])
    back_motor.thrust(data['back'])
    front_motor.thrust(data['front'])

@sio.on('sense')
def on_sense():
    p1 = 0 if GPIO.input(5) else 1
    p2 = 0 if GPIO.input(6) else 1
    sio.emit('sense', p1 + p2)

@sio.on('disconnect')
def on_disconnect():
    print('disconnected from server')
    for motor in all_motors:
        motor.thrust(0)

url = sys.argv[1]
print(url)
sio.connect(url, wait_timeout=10)
