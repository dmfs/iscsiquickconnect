# iSCSI Quick Connect

Effortlessly manage iSCSI connections directly from your GNOME Shell.

Quickly discover, connect, and disconnect iSCSI volumes. 

This extensions requires udisks2 and the udisks2-iscsi module.

## Known Limitations

* Multipath is not supported propertly
* Logout does not check if the volume is in use (data loss might happen when disconnecting a volume that's mounted)
* Connecting authenticated targets may or may not work
* Removing portals or targets is not supported yet
* Cancelling the authentication dialog may leave the switch in an incorrect state

At present, the plugin has basically all the features I needs. If you're interested in another feature, please file an issue.

## Sponsor

Consider becoming a sponsor to support the continued development if iSCIS Quick Connect. Your sponsorship helps ensure ongoing maintenance, 
new features, and smoother integration with GNOME Shell. For individuals or organizations, I can provide invoices
for contributions.

## License

Copyright (C) 2025 dmfs GmbH

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public
License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program; if not, write to the Free
Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.


