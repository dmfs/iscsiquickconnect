/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Gio from 'gi://Gio';

import { create_proxy } from "./udisks2.js";

const UDisks2ISCSISession = 'org.freedesktop.UDisks2.ISCSI.Session';

const IscsiSessionProxy = Gio.DBusProxy.makeProxyWrapper(`
    <node>
        <interface name="${UDisks2ISCSISession}">
            <method name="Logout">
                <arg name="options" type="a{sv}" direction="in"/>
            </method>
        </interface>
    </node>
    `);

class IscsiSession {
    constructor(dbus_object_name, session_object) {
        this.session_proxy = create_proxy(IscsiSessionProxy, 'org.freedesktop.UDisks2', dbus_object_name);
        this.dbus_object_name = dbus_object_name;
        this.session_object = session_object;
    }

    target() {
        return this.session_object.target_name?.deep_unpack();
    }

    async logout() {
        return await (await this.session_proxy).LogoutAsync();
    }

    destroy() {
        this.session_proxy = null;
    }
}

export { IscsiSession, UDisks2ISCSISession }