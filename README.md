![asterism-logo](https://raw.githubusercontent.com/gxapplications/asterism/master/docs/asterism-text.png)

# asterism-plugin-zwave

_This asterism plugin will add z-wave support to control Z-wave compatible devices_

---

[![release date](https://img.shields.io/github/release-date/gxapplications/asterism-plugin-zwave.svg)](https://github.com/gxapplications/asterism-plugin-zwave/releases)
[![npm package version](https://badge.fury.io/js/asterism-plugin-zwave.svg?logo=npm)](https://www.npmjs.com/package/asterism-plugin-zwave)
[![npm downloads](https://img.shields.io/npm/dt/asterism-plugin-zwave.svg?logo=npm&label=npm%20downloads)](https://www.npmjs.com/package/asterism-plugin-zwave)

_[Roadmap available here (asterism and plugins)](https://github.com/users/gxapplications/projects/1)_

---

## INSTALL PREREQUISITES

You need to install version 1.6 version of OpenZWave/open-zwave.
As this specific version is the only one tested with asterism, I tagged a version on my fork of of official repository,
named 'V1.6 used for asterism-plugin-zwave ^v1.0.3'.

You need to run these commands:

```
cd ~
git clone https://github.com/gxapplications/open-zwave
cd open-zwave
sudo apt-get install libudev-dev
make
sudo make install
sudo ln -s /usr/local/lib64/libopenzwave.so /usr/local/lib/libopenzwave.so
sudo ln -s /usr/local/lib64/libopenzwave.so /usr/local/lib/libopenzwave.so.1.6
sudo ln -s /usr/local/lib64/libopenzwave.so /usr/lib/libopenzwave.so
sudo ln -s /usr/local/lib64/libopenzwave.so /usr/lib/libopenzwave.so.1.6
```

After that you can remove ~/open-zwave folder.

Scenarii plugin (an asterism standard built-in plugin) must be activated (true by default).
Then you'll be able to install asterism (see asterism install guide).


## TESTED & COMPATIBLE DEVICES

I add devices when I buy them, so there is the list of devices I managed today:
- Aeotec Z-Stick Gen5 (but other USB Z-wave keys should work to control your network...)
- Fibaro Door Opening Sensor 2 (FGDW-002) for door sensor, temperature and burglar alarms
- Fibaro Wall Plug (FGWPE-102 ZW5) with full features support (on/off, color ring, advanced configuration)
- Fibaro RGBW module support (for controlling LEDs only, not input connectors)
- Hank 4 buttons Wall controller (HKZW-SCN04) through central scene support: allowing 8 actions
- Standard binary switches SHOULD work too (for on/off feature only) on most models.

If you want more devices, you have choice:
- Propose your support in a GitHub pull request, we can work together.
- Send the device to me as a gift :) I will make it compatible as soon as possible.


## Troubleshooting about USB Autosuspend mode

Some systmes activates Autosuspend mode on USB devices. This mode will freeze some Z-wave
controllers after few seconds. You need to deactivate Autosuspend mode for your USB controller
key. It depends on your operating system. For Ubuntu 14 `lsusb` will display your controller ID
(format 1234:5678) and thenyou can blacklist your device ID in file `/etc/default/tlp` at the
USB_BLACKLIST option.

:copyright: 2017-2022 GXApplications. [ [Roadmap/Milestones](https://github.com/gxapplications/asterism/milestones?direction=asc&sort=due_date&state=open) | [License](https://github.com/gxapplications/asterism-plugin-zwave/blob/master/LICENSE.md) ]
