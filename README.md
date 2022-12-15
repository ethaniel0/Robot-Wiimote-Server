# Robot Wiimote Server

This project consists of a server to connect to a Rasbperry Pi, and a website it hosts that connects to a Wiimote.

## The Server
The Python backend is a Flask server. When the Raspberry Pi connects, it goes through multiple commications over websckets to ensure it's ready to take commands. Once the robot is ready, the server will send commands.

When the website sends commands to the thrusters, it normalizes the values to between 0 and 1 and sends it those commands to the Raspberry Pi.

## The Website
The website has two pages, for different types of controls. **/control** brings you to keyboard controls, where you can set your keyboard layout and control the robot as if it's a game.

The main page is **/wii**, which also displays live video from the robot's camera. For inputs, it utilizes a Wiimote, connected over Bluetooth and controlled using the WebHID library. The base of this code comes from [PicciKevin's GitHub repo](https://github.com/PicchiKevin/wiimote-webhid). I then extended this code to enable the Wiimote's accesory reporting mode and get the buttons and accelerometer from the Wiimote, as well as the buttons, accelerometer, and joystick of the Nunchuk. 
