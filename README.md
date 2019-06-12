![asterism-logo](https://raw.githubusercontent.com/gxapplications/asterism/master/doc/asterism-text.png)

# asterism-plugin-zwave

_This asterism plugin will add z-wave support to control Z-wave compatible devices_

---

[![release date](https://img.shields.io/github/release-date/gxapplications/asterism-plugin-zwave.svg)](https://github.com/gxapplications/asterism-plugin-zwave/releases)
[![npm package version](https://badge.fury.io/js/asterism-plugin-zwave.svg?logo=npm)](https://www.npmjs.com/package/asterism-plugin-zwave)
[![npm downloads](https://img.shields.io/npm/dt/asterism-plugin-zwave.svg?logo=npm&label=npm%20downloads)](https://www.npmjs.com/package/asterism-plugin-zwave)
[![Dependencies](https://david-dm.org/gxapplications/asterism-plugin-zwave/status.svg?logo=dependabot)](https://david-dm.org/gxapplications/asterism-plugin-zwave)

_[Roadmap available here (asterism and plugins)](https://github.com/gxapplications/asterism/milestones?direction=asc&sort=due_date&state=open)_

---

## INSTALL PREREQUISITES

You need to install 'V1.6' version of OpenZWave/open-zwave + Central scenes support (PR #1125). TODO !0: see if central scenes support is ok
As this composed version is quite hard to get, I made a branch you can checkout on my open-zwave
fork of official repository, from official V1.6 tag with central scenes support added.

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
- Fibaro Door Opening Sensor 2 (FGDW-002) for door sensor and temperature
- Fibaro Wall Plug (FGWPE-102 ZW5) with full features support (on/off, color ring, advanced configuration)
- Hank 4 buttons Wall controller (HKZW-SCN04) through central scene support: allowing 8 actions
- Standard binary switches SHOULD work too (for on/off feature only) on most models.

Coming soon:
- Fibaro RGBW module support

If you want more devices, you have choice:
- Propose your support in a GitHub pull request, we can work together.
- Send the device to me as a gift :) I will make it compatible as soon as possible.

:copyright: 2017-2019 GXApplications. [ [Roadmap/Milestones](https://github.com/gxapplications/asterism/milestones?direction=asc&sort=due_date&state=open) | [License](https://github.com/gxapplications/asterism-plugin-zwave/blob/master/LICENSE.md) ]
