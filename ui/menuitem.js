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

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import St from 'gi://St';
import GObject from 'gi://GObject';
import { ActionButton } from './action_button.js';

export var EditableMenuItem = GObject.registerClass(
    class IscsiEditableMenuItem extends PopupMenu.PopupBaseMenuItem {
        _init(...actions) {
            super._init({
                reactive: false,
                can_focus: true,
            });

            const vertical_layout = new St.BoxLayout({ vertical: true, x_expand: true });
            const inner_layout = new St.BoxLayout({ vertical: false, x_expand: true });
            const entry = new St.Entry({ hint_text: "host", x_expand: true });
            inner_layout.add_child(entry)
            actions.map(action => new ActionButton(action, () => entry.text))
                .forEach(actionButton => inner_layout.add_child(actionButton));
            this.error = new St.Bin();
            vertical_layout.add_child(inner_layout);
            vertical_layout.add_child(this.error);
            this.add_child(vertical_layout);
        }

        set_error(error) {
            this.error.set_child(new St.Label({ text: error, x_expand: true, style: "font-weight:bold; padding-top: 4pt" }));
        }
    });
