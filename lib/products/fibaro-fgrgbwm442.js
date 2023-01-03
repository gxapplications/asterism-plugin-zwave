'use strict'

import debounce from 'debounce'

import UnknownProduct from './unknown'
import MultiLevelSwitchSupport from './mixin-multi-level-switch'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'
import MeterSupport from './mixin-meter'
import EnergyConsumptionMeterSupport from './mixin-energy-consumption'

/*
  https://products.z-wavealliance.org/products/3589
  https://manuals.fibaro.com/rgbw-2/

  SUPPORTED:
    COMMAND_CLASS_SWITCH_MULTILEVEL / COMMAND_CLASS_SWITCH_MULTILEVEL_V2 : instances 1 to 6, same structure :
      {"class_id":38,"instance":1,"index":9,"label":"Instance 1: Target Value","value":0}.
      {"class_id":38,"instance":1,"index":6,"label":"Instance 1: Step Size","value":0}.
      {"class_id":38,"instance":1,"index":7,"label":"Instance 1: Inc"}.
      {"class_id":38,"instance":1,"index":8,"label":"Instance 1: Dec"}.
      {"class_id":38,"instance":1,"index":5,"label":"Instance 1: Dimming Duration","value":-1}.
      {"class_id":38,"instance":1,"index":0,"label":"Instance 1: Level","value":0}.
      {"class_id":38,"instance":1,"index":1,"label":"Instance 1: Bright"}.
      {"class_id":38,"instance":1,"index":2,"label":"Instance 1: Dim"}.
      {"class_id":38,"instance":1,"index":3,"label":"Instance 1: Ignore Start Level","value":true}.
      {"class_id":38,"instance":1,"index":4,"label":"Instance 1: Start Level","value":0}.

<Value type="byte" genre="user" instance="6" index="0" label="Level" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="0">
    <Help>The Current Level of the Device</Help>
</Value>
<Value type="button" genre="user" instance="6" index="1" label="Up" units="" read_only="false" write_only="true" verify_changes="false" poll_intensity="0" min="0" max="0">
    <Help>Increase the Brightness of the Device</Help>
</Value>
<Value type="button" genre="user" instance="6" index="2" label="Down" units="" read_only="false" write_only="true" verify_changes="false" poll_intensity="0" min="0" max="0">
    <Help>Decrease the Brightness of the Device</Help>
</Value>
<Value type="bool" genre="system" instance="6" index="3" label="Ignore Start Level" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" value="True">
    <Help>Ignore the Start Level of the Device when increasing/decreasing brightness</Help>
</Value>
<Value type="byte" genre="system" instance="6" index="4" label="Start Level" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="0">
    <Help>Start Level when Changing the Brightness of a Device</Help>
</Value>
<Value type="int" genre="system" instance="6" index="5" label="Dimming Duration" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="-2147483648" max="2147483647" value="0">
    <Help>Duration taken when changing the Level of a Device (Values above 7620 use the devices default duration)</Help>
</Value>
<Value type="byte" genre="user" instance="6" index="6" label="Step Size" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="0">
    <Help>How Many Percent Change when incrementing/decrementing the Level of a Device</Help>
</Value>
<Value type="button" genre="user" instance="6" index="7" label="Inc" units="" read_only="false" write_only="true" verify_changes="false" poll_intensity="0" min="0" max="0">
    <Help>Increment the Level of a Device</Help>
</Value>
<Value type="button" genre="user" instance="6" index="8" label="Dec" units="" read_only="false" write_only="true" verify_changes="false" poll_intensity="0" min="0" max="0">
    <Help>Decrement the Level of a Device</Help>
</Value>
<Value type="byte" genre="system" instance="6" index="9" label="Target Value" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="0">
    <Help></Help>
</Value>



  CONFIG CLASS, differs from previous 441 model:
    {"class_id":112,"instance":1,"index":1,"label":"Remember device status before the power failure","value":"device remains switched off"}.
    {"class_id":112,"instance":1,"index":20,"label":"Input 1 - operating mode","value":"Momentary switch (Central Scene)"}.
    {"class_id":112,"instance":1,"index":21,"label":"Input 2 - operating mode","value":"Momentary switch (Central Scene)"}.
    {"class_id":112,"instance":1,"index":22,"label":"Input 3 - operating mode","value":"Momentary switch (Central Scene)"}.
    {"class_id":112,"instance":1,"index":23,"label":"Input 4 - operating mode","value":"Momentary switch (Central Scene)"}.
    {"class_id":112,"instance":1,"index":30,"label":"Alarm configuration - 1st slot","value":0}.
    {"class_id":112,"instance":1,"index":31,"label":"Alarm configuration - 2nd slot","value":1358888960}.
    {"class_id":112,"instance":1,"index":32,"label":"Alarm configuration - 3rd slot","value":33488896}.
    {"class_id":112,"instance":1,"index":33,"label":"Alarm configuration - 4th slot","value":50266112}.
    {"class_id":112,"instance":1,"index":34,"label":"Alarm configuration - 5th slot","value":83820544}.
    {"class_id":112,"instance":1,"index":35,"label":"Duration of alarm signalization","value":600}.
    {"class_id":112,"instance":1,"index":40,"label":"Input 1 - sent scenes","value":15}.
    {"class_id":112,"instance":1,"index":41,"label":"Input 2 - sent scenes","value":15}.
    {"class_id":112,"instance":1,"index":42,"label":"Input 3 - sent scenes","value":15}.
    {"class_id":112,"instance":1,"index":43,"label":"Input 4 - sent scenes","value":15}.
    {"class_id":112,"instance":1,"index":62,"label":"Power reports - periodic","value":3600}.
    {"class_id":112,"instance":1,"index":63,"label":"Analog inputs reports and output change on input change","value":5}.
    {"class_id":112,"instance":1,"index":64,"label":"Analog inputs reports - periodic","value":0}.
    {"class_id":112,"instance":1,"index":65,"label":"Energy reports - on change","value":10}.
    {"class_id":112,"instance":1,"index":66,"label":"Energy reports - periodic","value":3600}.
    {"class_id":112,"instance":1,"index":150,"label":"Inputs - LED colour control mode","value":"RGBW mode (every input controls output with the same number, IN1‑OUT1, IN2‑OUT2, IN3‑OUT3, IN4‑OUT4)"}.
    {"class_id":112,"instance":1,"index":151,"label":"Local control - transition time","value":3}.
    {"class_id":112,"instance":1,"index":152,"label":"Remote control - transition time","value":3}.
    {"class_id":112,"instance":1,"index":154,"label":"ON frame value for single click","value":-1}.
    {"class_id":112,"instance":1,"index":155,"label":"OFF frame value for single click","value":0}.
    {"class_id":112,"instance":1,"index":156,"label":"ON frame value for double click","value":-1}.
    {"class_id":112,"instance":1,"index":157,"label":"Start programmed sequence","value":"sequence inactive"}.

<Value type="list" genre="config" instance="1" index="1" label="Remember device status before the power failure" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="1" vindex="0" size="1">
    <Help>This parameter determines how the device will react in the event of power supply failure (e.g. power outage or taking out from the electrical outlet). After the power supply is back on, the device can be restored to previous state or remain switched off. Default 0.</Help>
    <Item label="device remains switched off" value="0" />
    <Item label="device restores the state from before the power failure" value="1" />
</Value>
<Value type="list" genre="config" instance="1" index="20" label="Input 1 - operating mode" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="2" size="1">
    <Help>This parameter allows to choose mode of 1st input (IN1). Change it depending on connected device. Default 2 (momentary switch).</Help>
    <Item label="Analog input without internal pull-up (Sensor Multilevel)" value="0" />
    <Item label="Analog input with internal pull-up (Sensor Multilevel)" value="1" />
    <Item label="Momentary switch (Central Scene)" value="2" />
    <Item label="Toggle switch: switch state on every input change (Central Scene)" value="3" />
    <Item label="Toggle switch: contact closed - ON, contact opened - OFF (Central Scene)" value="4" />
</Value>
<Value type="list" genre="config" instance="1" index="21" label="Input 2 - operating mode" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="2" size="1">
    <Help>This parameter allows to choose mode of 2nd input (IN2). Change it depending on connected device. Default 2 (momentary switch).</Help>
    <Item label="Analog input without internal pull-up (Sensor Multilevel)" value="0" />
    <Item label="Analog input with internal pull-up (Sensor Multilevel)" value="1" />
    <Item label="Momentary switch (Central Scene)" value="2" />
    <Item label="Toggle switch: switch state on every input change (Central Scene)" value="3" />
    <Item label="Toggle switch: contact closed - ON, contact opened - OFF (Central Scene)" value="4" />
</Value>
<Value type="list" genre="config" instance="1" index="22" label="Input 3 - operating mode" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="2" size="1">
    <Help>This parameter allows to choose mode of 3rd input (IN3). Change it depending on connected device. Default 2 (momentary switch).</Help>
    <Item label="Analog input without internal pull-up (Sensor Multilevel)" value="0" />
    <Item label="Analog input with internal pull-up (Sensor Multilevel)" value="1" />
    <Item label="Momentary switch (Central Scene)" value="2" />
    <Item label="Toggle switch: switch state on every input change (Central Scene)" value="3" />
    <Item label="Toggle switch: contact closed - ON, contact opened - OFF (Central Scene)" value="4" />
</Value>
<Value type="list" genre="config" instance="1" index="23" label="Input 4 - operating mode" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="2" size="1">
    <Help>This parameter allows to choose mode of 4th input (IN4). Change it depending on connected device. Default 2 (momentary switch).</Help>
    <Item label="Analog input without internal pull-up (Sensor Multilevel)" value="0" />
    <Item label="Analog input with internal pull-up (Sensor Multilevel)" value="1" />
    <Item label="Momentary switch (Central Scene)" value="2" />
    <Item label="Toggle switch: switch state on every input change (Central Scene)" value="3" />
    <Item label="Toggle switch: contact closed - ON, contact opened - OFF (Central Scene)" value="4" />
</Value>
<Value type="int" genre="config" instance="1" index="30" label="Alarm configuration - 1st slot" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="-2147483648" max="2147483647" value="0">
    <Help>This parameter determines to which alarm frames and how the device should react.&#x0A;The parameters consist of 4 bytes, three most significant bytes are set according to the official Z-Wave protocol specification.&#x0A;1B [MSB] - notification Type.&#x0A;2B - notification Status.&#x0A;3B - Event/State Parameters.&#x0A;4B [LSB] action:&#x0A;    0x00 - no reaction&#x0A;    0x0X - turn off selected channel&#x0A;    0x1X - turn on selected channel&#x0A;    0x2X - blink selected channel&#x0A;    0x3Y - activate alarm sequence&#x0A;Default setting: [0x00, 0x00, 0x00, 0x00]</Help>
</Value>
<Value type="int" genre="config" instance="1" index="31" label="Alarm configuration - 2nd slot" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="-2147483648" max="2147483647" value="1358888960">
    <Help>This parameter determines to which alarm frames and how the device should react.&#x0A;The parameters consist of 4 bytes, three most significant bytes are set according to the official Z-Wave protocol specification.&#x0A;1B [MSB] - notification Type.&#x0A;2B - notification Status.&#x0A;3B - Event/State Parameters.&#x0A;4B [LSB] action:&#x0A;    0x00 - no reaction&#x0A;    0x0X - turn off selected channel&#x0A;    0x1X - turn on selected channel&#x0A;    0x2X - blink selected channel&#x0A;    0x3Y - activate alarm sequence&#x0A;Default setting: [0x05, 0xFF, 0x00, 0x00] (Water Alarm, any notification, no action)</Help>
</Value>
<Value type="int" genre="config" instance="1" index="32" label="Alarm configuration - 3rd slot" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="-2147483648" max="2147483647" value="33488896">
    <Help>This parameter determines to which alarm frames and how the device should react.&#x0A;The parameters consist of 4 bytes, three most significant bytes are set according to the official Z-Wave protocol specification.&#x0A;1B [MSB] - notification Type.&#x0A;2B - notification Status.&#x0A;3B - Event/State Parameters.&#x0A;4B [LSB] action:&#x0A;    0x00 - no reaction&#x0A;    0x0X - turn off selected channel&#x0A;    0x1X - turn on selected channel&#x0A;    0x2X - blink selected channel&#x0A;    0x3Y - activate alarm sequence&#x0A;Default setting: [0x01, 0xFF, 0x00, 0x00] (Smoke Alarm, any notification, no action)</Help>
</Value>
<Value type="int" genre="config" instance="1" index="33" label="Alarm configuration - 4th slot" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="-2147483648" max="2147483647" value="50266112">
    <Help>This parameter determines to which alarm frames and how the device should react.&#x0A;The parameters consist of 4 bytes, three most significant bytes are set according to the official Z-Wave protocol specification.&#x0A;1B [MSB] - notification Type.&#x0A;2B - notification Status.&#x0A;3B - Event/State Parameters.&#x0A;4B [LSB] action:&#x0A;    0x00 - no reaction&#x0A;    0x0X - turn off selected channel&#x0A;    0x1X - turn on selected channel&#x0A;    0x2X - blink selected channel&#x0A;    0x3Y - activate alarm sequence&#x0A;Default setting: [0x02, 0xFF, 0x00, 0x00] (CO Alarm, any notification, no action)</Help>
</Value>
<Value type="int" genre="config" instance="1" index="34" label="Alarm configuration - 5th slot" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="-2147483648" max="2147483647" value="83820544">
    <Help>This parameter determines to which alarm frames and how the device should react.&#x0A;The parameters consist of 4 bytes, three most significant bytes are set according to the official Z-Wave protocol specification.&#x0A;1B [MSB] - notification Type.&#x0A;2B - notification Status.&#x0A;3B - Event/State Parameters.&#x0A;4B [LSB] action:&#x0A;    0x00 - no reaction&#x0A;    0x0X - turn off selected channel&#x0A;    0x1X - turn on selected channel&#x0A;    0x2X - blink selected channel&#x0A;    0x3Y - activate alarm sequence&#x0A;Default setting: [0x04, 0xFF, 0x00, 0x00] (Heat Alarm, any notification, no action)</Help>
</Value>
<Value type="short" genre="config" instance="1" index="35" label="Duration of alarm signalization" units="sec" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="32400" value="600">
    <Help>This parameter determines the duration of alarm signaling (flashing mode and/or alarm sequence). Available values:&#x0A;0 - infinite signalization&#x0A;1-32400 (1s-9h, 1s step)&#x0A;Default 600 (10min).</Help>
</Value>
<Value type="byte" genre="config" instance="1" index="40" label="Input 1 - sent scenes" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="15" value="15">
    <Help>This parameter defines which actions result in sending scene ID and attribute assigned to them. Parameter is relevant only if parameter 20 is set to 2, 3 or 4. Actions can be summed up, e.g. 1+2+4+8=15 and entered as a value for the parameter. Available values:&#x0A;1 - Key pressed 1 time&#x0A;2 - Key pressed 2 times&#x0A;4 - Key pressed 3 times&#x0A;8 - Key hold down and key released&#x0A;Default 15.</Help>
</Value>
<Value type="byte" genre="config" instance="1" index="41" label="Input 2 - sent scenes" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="15" value="15">
    <Help>This parameter defines which actions result in sending scene ID and attribute assigned to them. Parameter is relevant only if parameter 20 is set to 2, 3 or 4. Actions can be summed up, e.g. 1+2+4+8=15 and entered as a value for the parameter. Available values:&#x0A;1 - Key pressed 1 time&#x0A;2 - Key pressed 2 times&#x0A;4 - Key pressed 3 times&#x0A;8 - Key hold down and key released&#x0A;Default 15.</Help>
</Value>
<Value type="byte" genre="config" instance="1" index="42" label="Input 3 - sent scenes" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="15" value="15">
    <Help>This parameter defines which actions result in sending scene ID and attribute assigned to them. Parameter is relevant only if parameter 20 is set to 2, 3 or 4. Actions can be summed up, e.g. 1+2+4+8=15 and entered as a value for the parameter. Available values:&#x0A;1 - Key pressed 1 time&#x0A;2 - Key pressed 2 times&#x0A;4 - Key pressed 3 times&#x0A;8 - Key hold down and key released&#x0A;Default 15.</Help>
</Value>
<Value type="byte" genre="config" instance="1" index="43" label="Input 4 - sent scenes" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="15" value="15">
    <Help>This parameter defines which actions result in sending scene ID and attribute assigned to them. Parameter is relevant only if parameter 20 is set to 2, 3 or 4. Actions can be summed up, e.g. 1+2+4+8=15 and entered as a value for the parameter. Available values:&#x0A;1 - Key pressed 1 time&#x0A;2 - Key pressed 2 times&#x0A;4 - Key pressed 3 times&#x0A;8 - Key hold down and key released&#x0A;Default 15.</Help>
</Value>
<Value type="short" genre="config" instance="1" index="62" label="Power reports - periodic" units="sec" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="32400" value="3600">
    <Help>This parameter determines in what time intervals the periodic power reports are sent to the main controller. Periodic reports do not depend of power change (parameter 61). Available values:&#x0A;0 - periodic reports are disabled&#x0A;30-32400 (30-32400s) - report interval&#x0A;Default 3600 (1h).</Help>
</Value>
<Value type="short" genre="config" instance="1" index="63" label="Analog inputs reports and output change on input change" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="100" value="5">
    <Help>This parameter defines minimal change (from the last reported) of analog input voltage that results in sending new report and change in the output value. Parameter is relevant only for analog inputs (parameter 20, 21, 22 or 23 set to 0 or 1). Available values:&#x0A;0 - reporting on change disabled&#x0A;1-100 (0.1-10V, 0.1V step)&#x0A;Default 5 (0.5V).</Help>
</Value>
<Value type="short" genre="config" instance="1" index="64" label="Analog inputs reports - periodic" units="sec" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="32400" value="0">
    <Help>This parameter defines reporting period of analog inputs value. Periodical reports are independent from changes in value (parameter 63). Parameter is relevant only for analog inputs (parameter 20, 21, 22 or 23 set to 0 or 1). Available values:&#x0A;0 - periodical reports disabled&#x0A;30-32400 (30-32400s, 1s step)&#x0A;Default 0 (periodical reports disabled).</Help>
</Value>
<Value type="short" genre="config" instance="1" index="65" label="Energy reports - on change" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="500" value="10">
    <Help>This parameter determines the minimum change in consumed energy that will result in sending new energy report to the main controller. Energy reports are sent no often than every 30 seconds. Available values:&#x0A;0 - reports are disabled&#x0A;1-500 (0.01 - 5 kWh) - change in energy&#x0A;Default 10 (0.1 kWh).</Help>
</Value>
<Value type="short" genre="config" instance="1" index="66" label="Energy reports - periodic" units="sec" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="32400" value="3600">
    <Help>This parameter determines in what time intervals the periodic energy reports are sent to the main controller. Periodic reports do not depend of energy change (parameter 65) Available values:&#x0A;0 - periodic reports are disabled&#x0A;30-32400 (30-32400s) - report interval&#x0A;Default 3600 (1h).&#x0A;</Help>
</Value>
<Value type="list" genre="config" instance="1" index="150" label="Inputs - LED colour control mode" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="0" size="1">
    <Help>This parameter determines how connected switches control LED strips. Default 0.</Help>
    <Item label="RGBW mode (every input controls output with the same number, IN1‑OUT1, IN2‑OUT2, IN3‑OUT3, IN4‑OUT4)" value="0" />
    <Item label="HSB and White mode (inputs works in HSB color model, IN1‑H (Hue), IN2‑S (Saturation), IN3‑B (Brightness), IN4‑White (OUT4)" value="1" />
</Value>
<Value type="short" genre="config" instance="1" index="151" label="Local control - transition time" units="sec" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="254" value="3">
    <Help>This parameter determines time of smooth transition between 0% and 100% when controlling with connected switches. Available values:&#x0A;0 - instantly&#x0A;1-127 (1s-127s, 1s step)&#x0A;128-254 (1min-127min, 1min step)&#x0A;Default 3.</Help>
</Value>
<Value type="short" genre="config" instance="1" index="152" label="Remote control - transition time" units="sec" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="254" value="3">
    <Help>This parameter determines time of smooth transition between initial and target state when controlling via Z-Wave network. Available values:&#x0A;0 - instantly&#x0A;1-127 (1s-127s, 1s step)&#x0A;128-254 (1min-127min, 1min step)&#x0A;Default 3.</Help>
</Value>
<Value type="int" genre="config" instance="1" index="154" label="ON frame value for single click" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="-1" value="-1">
    <Help>This parameter defines value sent to devices in association groups. The parameters consist of 4 bytes, each byte reserved for separate channel, from least significant (IN1) to most significant (IN4). Applicable for Basic Set and Switch Multilevel Set commands. Available values:&#x0A;For every byte: 0-99, 255.&#x0A;Default 4294967295 (0xFF FF FF FF - 255 for all channels).</Help>
</Value>
<Value type="int" genre="config" instance="1" index="155" label="OFF frame value for single click" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="-1" value="0">
    <Help>This parameter defines value sent to devices in association groups. The parameters consist of 4 bytes, each byte reserved for separate channel, from least significant (IN1) to most significant (IN4). Applicable for Basic Set and Switch Multilevel Set commands. Available values:&#x0A;For every byte: 0-99, 255.&#x0A;Default 0 (0x00 00 00 00 - 0 for all channels).</Help>
</Value>
<Value type="int" genre="config" instance="1" index="156" label="ON frame value for double click" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" value="-1">
    <Help>This parameter defines value sent to devices in association groups. The parameters consist of 4 bytes, each byte reserved for separate channel, from least significant (IN1) to most significant (IN4). Applicable for Basic Set and Switch Multilevel Set commands. Available values:&#x0A;For every byte: 0-99, 255.&#x0A;Default 0 (0x63 63 63 63 - 99 for all channels).</Help>
</Value>
<Value type="list" genre="config" instance="1" index="157" label="Start programmed sequence" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="0" size="1">
    <Help>Setting this parameter will start programmed sequence with selected number. User can define own sequences via controller. Default 0.</Help>
    <Item label="sequence inactive" value="0" />
    <Item label="user-defined sequence 1" value="1" />
    <Item label="user-defined sequence 2" value="2" />
    <Item label="user-defined sequence 3" value="3" />
    <Item label="user-defined sequence 4" value="4" />
    <Item label="user-defined sequence 5" value="5" />
    <Item label="Fireplace sequence" value="6" />
    <Item label="Storm sequence" value="7" />
    <Item label="Rainbow sequence" value="8" />
    <Item label="Aurora sequence" value="9" />
    <Item label="Police (red-white-blue) sequence" value="10" />
</Value>

  ???
    {"class_id":51,"instance":1,"index":0,"label":"Color","value":"#00000000"}.
    {"class_id":51,"instance":1,"index":2,"label":"Color Channels","value":0}.
    {"class_id":51,"instance":2,"index":2,"label":"Color Channels","value":0}.
    {"class_id":51,"instance":1,"index":2,"label":"Color Channels","value":29}.
    {"class_id":51,"instance":1,"index":1,"label":"Color Index","value":"Off"}.
    {"class_id":51,"instance":1,"index":4,"label":"Duration","value":-1}.
    {"class_id":51,"instance":1,"index":5,"label":"Target Color","value":"#000000"}.
    {"class_id":51,"instance":2,"index":2,"label":"Color Channels","value":29}.
    {"class_id":51,"instance":2,"index":0,"label":"Color","value":"#000000"}.
    {"class_id":51,"instance":2,"index":1,"label":"Color Index","value":"Off"}.
    {"class_id":51,"instance":2,"index":4,"label":"Duration","value":-1}.
    {"class_id":51,"instance":2,"index":5,"label":"Target Color","value":"#000000"}.

  ???
    {"class_id":152,"instance":1,"index":0,"label":"Instance 1: Secured","value":false}.
    {"class_id":152,"instance":1,"index":0,"label":"Instance 1: Secured","value":false}.
    {"class_id":152,"instance":2,"index":0,"label":"Instance 2: Secured","value":false}.
    {"class_id":152,"instance":2,"index":0,"label":"Instance 2: Secured","value":false}.
    {"class_id":152,"instance":3,"index":0,"label":"Instance 3: Secured","value":false}.
    {"class_id":152,"instance":3,"index":0,"label":"Instance 3: Secured","value":false}.
    {"class_id":152,"instance":4,"index":0,"label":"Instance 4: Secured","value":false}.
    {"class_id":152,"instance":4,"index":0,"label":"Instance 4: Secured","value":false}.
    {"class_id":152,"instance":5,"index":0,"label":"Instance 5: Secured","value":false}.
    {"class_id":152,"instance":5,"index":0,"label":"Instance 5: Secured","value":false}.
    {"class_id":152,"instance":6,"index":0,"label":"Instance 6: Secured","value":false}.
    {"class_id":152,"instance":6,"index":0,"label":"Instance 6: Secured","value":false}.
    {"class_id":152,"instance":7,"index":0,"label":"Instance 7: Secured","value":false}.
    {"class_id":152,"instance":7,"index":0,"label":"Instance 7: Secured","value":false}.
    {"class_id":152,"instance":8,"index":0,"label":"Instance 8: Secured","value":false}.
    {"class_id":152,"instance":8,"index":0,"label":"Instance 8: Secured","value":false}.
    {"class_id":152,"instance":9,"index":0,"label":"Instance 9: Secured","value":false}.
    {"class_id":152,"instance":9,"index":0,"label":"Instance 9: Secured","value":false}.
    {"class_id":152,"instance":10,"index":0,"label":"Instance 10: Secured","value":false}.
    {"class_id":152,"instance":10,"index":0,"label":"Instance 10: Secured","value":false}.

  CHANGED FROM 441 : not Watts anymore, Volts instead !
    {"class_id":49,"instance":1,"index":15,"label":"Instance 1: Voltage","value":"0.0"}.
    {"class_id":49,"instance":1,"index":270,"label":"Instance 1: Voltage Units","value":"Volts"}.
    {"class_id":49,"instance":2,"index":15,"label":"Instance 2: Voltage","value":"0.0"}.
    {"class_id":49,"instance":2,"index":270,"label":"Instance 2: Voltage Units","value":"Volts"}.
    {"class_id":49,"instance":3,"index":15,"label":"Instance 3: Voltage","value":"0.0"}.
    {"class_id":49,"instance":3,"index":270,"label":"Instance 3: Voltage Units","value":"Volts"}.
    {"class_id":49,"instance":4,"index":15,"label":"Instance 4: Voltage","value":"0.0"}.
    {"class_id":49,"instance":4,"index":270,"label":"Instance 4: Voltage Units","value":"Volts"}.
    {"class_id":49,"instance":5,"index":15,"label":"Instance 5: Voltage","value":"0.0"}.
    {"class_id":49,"instance":5,"index":270,"label":"Instance 5: Voltage Units","value":"Volts"}.

  CHANGED FROM 441 : 2 instances instead of 1, why ?
    {"class_id":50,"instance":1,"index":0,"label":"Electric - kWh","value":"0.0"}.
    {"class_id":50,"instance":1,"index":2,"label":"Electric - W","value":"0.0"}.
    {"class_id":50,"instance":1,"index":256,"label":"Exporting","value":false}.
    {"class_id":50,"instance":1,"index":257,"label":"Reset"}.
    {"class_id":50,"instance":2,"index":0,"label":"Electric - kWh","value":"0.0"}.
    {"class_id":50,"instance":2,"index":2,"label":"Electric - W","value":"0.0"}.
    {"class_id":50,"instance":2,"index":256,"label":"Exporting","value":false}.
    {"class_id":50,"instance":2,"index":257,"label":"Reset"}.

  ???
    {"class_id":91,"instance":1,"index":256,"label":"Scene Count","value":0}.
    {"class_id":91,"instance":1,"index":257,"label":"Scene Reset Timeout","value":1000}.
    {"class_id":91,"instance":1,"index":256,"label":"Scene Count","value":4}.
    {"class_id":91,"instance":1,"index":1,"label":"Scene 1","value":"Inactive"}.
    {"class_id":91,"instance":1,"index":2,"label":"Scene 2","value":"Inactive"}.
    {"class_id":91,"instance":1,"index":3,"label":"Scene 3","value":"Inactive"}.
    {"class_id":91,"instance":1,"index":4,"label":"Scene 4","value":"Inactive"}.
 */

class FibaroFgrgbwm442 extends UnknownProduct.with(
    MultiLevelSwitchSupport(2, 0, { minLevel: 0, maxLevel: 255 }), // Brightness
    MultiLevelSwitchSupport(3, 0, { minLevel: 0, maxLevel: 255 }), // R: Red
    MultiLevelSwitchSupport(4, 0, { minLevel: 0, maxLevel: 255 }), // G: Green
    MultiLevelSwitchSupport(5, 0, { minLevel: 0, maxLevel: 255 }), // B: Blue
    MultiLevelSwitchSupport(6, 0, { minLevel: 0, maxLevel: 255 }), // W: White
) {

  getName () {
    return this.zwave.getNodeName(this.node.nodeid) || FibaroFgrgbwm442.meta.name(this.node.nodeid)
  }

}

FibaroFgrgbwm442.meta = {
  name: (nodeid) => `RGBW controller #${nodeid} (FIBARO RGBW Controller 2)`,
  manufacturer: 'FIBARO System',
  manufacturerid: '0x010f',
  product: 'FGRGBWM-442',
  producttype: '0x0902',
  productid: '0x1000',
  type: 'RGBW controller 2',
  passive: false,
  battery: false,
  icon: 'FibaroFgrgbwm441',
  settingPanel: 'fibaro-fgrgbwm442',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation',
    'multiLevelSwitchSetPercent', 'multiLevelSwitchSetValue', 'multiLevelSwitchGetPercent', 'multiLevelSwitchGetValue',
  ],
}

export default FibaroFgrgbwm442
