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

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { EditableMenuItem } from './ui/menuitem.js';
import { init as init_udisk2, udisks2_manager, iscsi_initiator, udisks2_object_manager, destroy as destroy_udisks2 } from './udisks2/udisks2.js'
import { IscsiSession, UDisks2ISCSISession } from './udisks2/session.js';

const Indicator = GObject.registerClass(
    class DmfsIscsiQuickConnectIndicator extends PanelMenu.Button {
        _init(settings) {
            super._init(0.0, _('iscsiquickconnect'));
            this.settings = settings;

            this.portals = new Map(Object.entries(JSON.parse(this.settings.get_string("portals"))));

            // TODO: replace with an icon
            this.label = new St.Label({
                style_class: 'panel-button',
                text: 'iSCSI',
                y_align: Clutter.ActorAlign.CENTER
            });

            this.add_child(this.label);
            this.setMenu(new PopupMenu.PopupMenu(this, 0.0, St.Side.TOP, 0));

            udisks2_manager
                .then(udisks2 => udisks2.EnableModuleAsync("iscsi", true))
                .then(any => log(`iscsi enabled`))
                .then(any => udisks2_object_manager)
                .then(object_manager => object_manager.connectSignal("InterfacesAdded", this.onInterfaceAdded.bind(this)))
                .then(any => udisks2_object_manager)
                .then(object_manager => object_manager.connectSignal("InterfacesRemoved", this.onInterfaceRemoved.bind(this)))
                .then(any => udisks2_object_manager)
                .then(object_manager => object_manager.GetManagedObjectsAsync())
                .then(sessions => this.sessions = this.map_sessions(sessions))
                .then(anything => this.update_menu())
                .catch(e => log(`iscsi error: ${e}`))
        }

        map_sessions(sessions) {
            log("mapping sessions");
            return new Map(sessions.flatMap(entry => Object.entries(entry))
                .filter(entry => UDisks2ISCSISession in entry[1])
                .map(entry => new IscsiSession(entry[0], entry[1][UDisks2ISCSISession]))
                .map(session => [session.target(), session]));
        }

        update_menu() {
            log("updating menu");
            this.menu.removeAll();
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem("Targets"))
            for (const [portal, portal_data] of this.portals) {
                if (portal_data['enabled']) {
                    for (const target of portal_data['targets']) {
                        const target_item = new PopupMenu.PopupSwitchMenuItem(target[0], false)
                        target_item.connect('activate', () =>
                        (this.sessions && this.sessions.has(target[0])
                            ? this.sessions.get(target[0])?.logout().catch(e => log(e))
                            : iscsi_initiator.then(iscsi => iscsi.LoginAsync(...target))
                                .catch(error => {
                                    log(error);
                                    udisks2_object_manager.then(manager => manager.GetManagedObjectsAsync())
                                        .then(sessions => this.sessions = this.map_sessions(sessions))
                                        .then(anything => this.update_menu())
                                        .catch(error => {
                                            this.update_menu();
                                            log(error);
                                        });
                                }
                                )));

                        target_item.setToggleState(this.sessions && this.sessions.has(target[0]))
                        this.menu.addMenuItem(target_item)
                    }
                }
            }
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem("Portals"))

            for (const [portal, portal_data] of this.portals) {
                const portal_item = new PopupMenu.PopupSwitchMenuItem(portal, portal_data['enabled'])
                portal_item.connect('toggled', () => {
                    this.portals.get(portal)['enabled'] = portal_item.state;
                    this.settings.set_string("portals", JSON.stringify(Object.fromEntries(this.portals)));
                    this.update_menu();
                });
                this.menu.addMenuItem(portal_item)
            }


            this.menu.addMenuItem(new EditableMenuItem(
                {
                    icon: "system-search-symbolic",
                    tooltip: "Add Portal",
                    callback: portal => this.discover_send_targets(portal)
                }
            ));
        }

        discover_send_targets(portal, enable = true) {
            iscsi_initiator.then(iscsi => iscsi.DiscoverSendTargetsAsync(portal, 0, []))
                .then(([targets, count]) => {
                    log(targets);
                    this.portals.set(portal, { "targets": targets, "enabled": enable });
                    this.settings.set_string("portals", JSON.stringify(Object.fromEntries(this.portals)));
                    this.update_menu();
                })
                .then(any => this.menu.close(true))
                .catch(error => log(error)) // TODO: show error
        }

        onInterfaceAdded(proxy, nameOwner, [object_path, interfaces]) {
            if (UDisks2ISCSISession in interfaces) {
                const session = new IscsiSession(object_path, interfaces[UDisks2ISCSISession]);
                log(`registering session for ${session.target()}`);
                this.sessions.set(session.target(), session);
                this.update_menu();
            }
        }

        onInterfaceRemoved(proxy, nameOwner, [object_path, interfaces]) {
            if (interfaces.includes(UDisks2ISCSISession)) {
                const target = Array.from(this.sessions).filter(([key, value]) => value.dbus_object_name === object_path)?.[0]?.[0];
                if (target) {
                    log(`unregistering session for ${target}`);
                    this.sessions.get(target)?.destroy();
                    this.sessions.delete(target);
                    this.update_menu();
                }
            }
        }

        destroy() {
            this.sessions.forEach(value => value.destroy());
            super.destroy();
        }
    });


export default class IscsiToolExtension extends Extension {
    constructor(metadata) {
        super(metadata);
    }

    enable() {
        init_udisk2();
        this._indicator = new Indicator(this.getSettings());
        Main.panel.addToStatusArea(this.metadata.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
        destroy_udisks2();
    }
}
