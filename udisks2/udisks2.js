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

import Gio from "gi://Gio";
import { debug } from "../utils/log.js";

const UDisks2ObjectManagerProxy = Gio.DBusProxy.makeProxyWrapper(`
    <node>
        <interface name="org.freedesktop.DBus.ObjectManager">
            <method name="GetManagedObjects">
                <arg name="objects" type="a{oa{sa{sv}}}" direction="out"/>
            </method>
            <signal name="InterfacesAdded">
                <arg name="object" type="o" direction="out"/>
                <arg name="interfaces" type="a{sa{sv}}" direction="out"/>
            </signal>
            <signal name="InterfacesRemoved">
                <arg name="object" type="o" direction="out"/>
                <arg name="interfaces" type="as" direction="out"/>
            </signal>
        </interface>
    </node>
    `);

const UDisks2ManagerProxy = Gio.DBusProxy.makeProxyWrapper(`
    <node>
        <interface name="org.freedesktop.UDisks2.Manager">
            <method name="EnableModule">
                <arg name="name" type="s" direction="in"/>
                <arg name="enable" type="b" direction="in"/>
            </method>
        </interface>
    </node>
    `);

const IscsiInitiatorProxy = Gio.DBusProxy.makeProxyWrapper(`
    <node>
        <interface name="org.freedesktop.UDisks2.Manager.ISCSI.Initiator">
            <method name="DiscoverSendTargets">
                <arg type="s" name="address" direction="in"/>
                <arg type="q" name="port" direction="in"/>
                <arg type="a{sv}" name="options" direction="in"/>
                <arg type="a(sisis)" name="nodes" direction="out"/>
                <arg type="i" name="nodes_cnt" direction="out"/>
            </method>
            <method name="Login">
                <arg type="s" name="name" direction="in"/>
                <arg type="i" name="tpgt" direction="in"/>
                <arg type="s" name="address" direction="in"/>
                <arg type="i" name="port" direction="in"/>
                <arg type="s" name="iface" direction="in"/>
                <arg type="a{sv}" name="options" direction="in"/>
            </method>
        </interface>
    </node>
    `);

async function create_proxy(class_name, ...args) {
  return new Promise(
    (resolve, reject) =>
      new class_name(Gio.DBus.system, ...args, (proxy, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(proxy);
        }
      }),
  );
}

var udisks2_object_manager;
var udisks2_manager;
var iscsi_initiator;

async function init() {
  debug("Initializing udisks2 D-Bus proxy...");

  udisks2_object_manager = await create_proxy(
    UDisks2ObjectManagerProxy,
    "org.freedesktop.UDisks2",
    "/org/freedesktop/UDisks2",
  );

  udisks2_manager = await create_proxy(
    UDisks2ManagerProxy,
    "org.freedesktop.UDisks2",
    "/org/freedesktop/UDisks2/Manager",
  );

  iscsi_initiator = await create_proxy(
    IscsiInitiatorProxy,
    "org.freedesktop.UDisks2",
    "/org/freedesktop/UDisks2/Manager",
  );

  debug("UDisks2 proxy initialization complete");
}

function destroy() {
  udisks2_object_manager = null;
  udisks2_manager = null;
  iscsi_initiator = null;
  debug("UDisks2 proxy destroyed");
}

export {
  init,
  create_proxy,
  udisks2_object_manager,
  udisks2_manager,
  iscsi_initiator,
  destroy,
};
