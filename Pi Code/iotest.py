import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

GPIO.setup(5, GPIO.IN)
GPIO.setup(6, GPIO.IN)

while True:
	p1 = 0 if GPIO.input(5) else 1
	# p2 = 0 if GPIO.input(6) else 1
	p2 = 0
	total = p1 + p2
	print(GPIO.input(6))
	time.sleep(1)

