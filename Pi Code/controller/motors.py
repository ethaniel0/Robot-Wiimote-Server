import os     #importing os library so as to communicate with the system
import time   #importing time library to make Rpi wait because its too impatient 
os.system ("sudo pigpiod") #Launching GPIO library
time.sleep(1) # As i said it is too impatient and so if this delay is removed you will get an error
import pigpio #importing GPIO library

class Motor:
    # no thrust is in between 1460 and 1540 --> 1500
    no_thrust = 1500
    max_value = no_thrust + 600  # change this if your ESC's max value is different or leave it be
    min_value = no_thrust - 600  #change this if your ESC's min value is different or leave it be
    def __init__(self, pin) -> None:
        self.ESC = pin
        self.pi = pigpio.pi()
        self.pi.set_servo_pulsewidth(self.ESC, 0)

    # speed from -1 to 1
    def thrust(self, speed):
        if speed > 1:
            speed = 1
        elif speed < -1:
            speed = -1
        pulse = Motor.min_value + (Motor.max_value - Motor.min_value) * (speed + 1) / 2
        self.pi.set_servo_pulsewidth(self.ESC, pulse)
