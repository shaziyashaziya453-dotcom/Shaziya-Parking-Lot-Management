
document.addEventListener('DOMContentLoaded', () => {
    const message = document.getElementById('message');

    function showMessage(text, isError = false) {
        if (!message) {
            console.log(text);
            return;
        }

        message.textContent = text;
        message.style.color = isError ? '#dc2626' : '#15803d';
    }

    async function api(url, method = 'GET', data = null) {
        const options = {
            method,
            headers: {}
        };

        if (data !== null) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const text = await response.text();

        let result = {};
        try {
            result = text ? JSON.parse(text) : {};
        } catch {
            throw new Error('Server returned an invalid response.');
        }

        if (!response.ok) {
            throw new Error(result.error || result.message || `Request failed (${response.status})`);
        }

        return result;
    }

    function makeTable(headers, rows) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });

        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        if (rows.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.textContent = 'No records found';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            rows.forEach(row => {
                const tr = document.createElement('tr');

                row.forEach(value => {
                    const td = document.createElement('td');

                    if (value instanceof Node) {
                        td.appendChild(value);
                    } else {
                        td.textContent = value ?? '';
                    }

                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        return table;
    }

    function actionButton(label, callback) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', callback);
        return button;
    }

    function setTable(id, headers, rows) {
        const container = document.getElementById(id);

        if (container) {
            container.replaceChildren(makeTable(headers, rows));
        }
    }

    // USERS

    async function loadUsers() {
        const users = await api('/api/users');

        document.getElementById('totalUsers').textContent = users.length;

        const rows = users.map(user => [
            user.user_id,
            user.name,
            user.phone,
            user.email,
            user.role,
            actionButton('Edit', () => editUser(user)),
            actionButton('Delete', () => deleteUser(user.user_id))
        ]);

        setTable(
            'userTable',
            ['ID', 'Name', 'Phone', 'Email', 'Role', 'Edit', 'Delete'],
            rows
        );
    }

    document.getElementById('userForm').addEventListener('submit', async event => {
        event.preventDefault();

        try {
            const id = document.getElementById('userId').value;

            const data = {
                name: document.getElementById('name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                role: document.getElementById('role').value.trim()
            };

            await api(
                id ? `/api/users/${id}` : '/api/users',
                id ? 'PUT' : 'POST',
                data
            );

            event.target.reset();
            document.getElementById('userId').value = '';

            showMessage('User saved successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    function editUser(user) {
        document.getElementById('userId').value = user.user_id;
        document.getElementById('name').value = user.name;
        document.getElementById('phone').value = user.phone;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        document.getElementById('name').focus();
    }

    async function deleteUser(id) {
        if (!confirm('Delete this user?')) return;

        try {
            await api(`/api/users/${id}`, 'DELETE');
            showMessage('User deleted successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    document.getElementById('cancelUser').addEventListener('click', () => {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
    });

    // VEHICLES

    async function loadVehicles() {
        const vehicles = await api('/api/vehicles');

        document.getElementById('totalVehicles').textContent = vehicles.length;

        const rows = vehicles.map(vehicle => [
            vehicle.vehicle_id,
            vehicle.vehicle_number,
            vehicle.vehicle_type,
            vehicle.vehicle_model,
            vehicle.owner_name || vehicle.user_id,
            actionButton('Delete', () => deleteVehicle(vehicle.vehicle_id))
        ]);

        setTable(
            'vehicleTable',
            ['ID', 'Number', 'Type', 'Model', 'Owner', 'Delete'],
            rows
        );
    }

    document.getElementById('vehicleForm').addEventListener('submit', async event => {
        event.preventDefault();

        try {
            await api('/api/vehicles', 'POST', {
                user_id: document.getElementById('vehicleUserId').value,
                vehicle_number: document.getElementById('vehicleNumber').value.trim(),
                vehicle_type: document.getElementById('vehicleType').value.trim(),
                vehicle_model: document.getElementById('vehicleModel').value.trim()
            });

            event.target.reset();
            showMessage('Vehicle added successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    async function deleteVehicle(id) {
        if (!confirm('Delete this vehicle?')) return;

        try {
            await api(`/api/vehicles/${id}`, 'DELETE');
            showMessage('Vehicle deleted successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    // PARKING SLOTS

    async function loadSlots() {
        const slots = await api('/api/slots');

        document.getElementById('totalSlots').textContent = slots.length;

        document.getElementById('availableSlots').textContent =
            slots.filter(slot => slot.status === 'Available').length;

        const rows = slots.map(slot => [
            slot.slot_id,
            slot.slot_number,
            slot.vehicle_type,
            slot.location,
            slot.status,
            actionButton('Delete', () => deleteSlot(slot.slot_id))
        ]);

        setTable(
            'slotTable',
            ['ID', 'Slot', 'Vehicle Type', 'Location', 'Status', 'Delete'],
            rows
        );
    }

    document.getElementById('slotForm').addEventListener('submit', async event => {
        event.preventDefault();

        try {
            await api('/api/slots', 'POST', {
                slot_number: document.getElementById('slotNumber').value.trim(),
                vehicle_type: document.getElementById('slotVehicleType').value.trim(),
                location: document.getElementById('slotLocation').value.trim(),
                status: 'Available'
            });

            event.target.reset();
            showMessage('Parking slot added successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    async function deleteSlot(id) {
        if (!confirm('Delete this parking slot?')) return;

        try {
            await api(`/api/slots/${id}`, 'DELETE');
            showMessage('Parking slot deleted successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    // PARKING RECORDS

    async function loadRecords() {
        const records = await api('/api/records');

        const rows = records.map(record => [
            record.record_id,
            record.vehicle_number,
            record.slot_number,
            record.entry_time,
            record.exit_time || 'Not exited',
            '₹' + (record.parking_fee ?? 0),
            record.status,
            record.status === 'Parked'
                ? actionButton('Vehicle Exit', () => vehicleExit(record.record_id))
                : 'Completed',
            actionButton('Delete', () => deleteRecord(record.record_id))
        ]);

        setTable(
            'recordTable',
            ['ID', 'Vehicle', 'Slot', 'Entry', 'Exit', 'Fee', 'Status', 'Exit Action', 'Delete'],
            rows
        );
    }

    document.getElementById('recordForm').addEventListener('submit', async event => {
        event.preventDefault();

        try {
            await api('/api/records', 'POST', {
                vehicle_id: document.getElementById('recordVehicleId').value,
                slot_id: document.getElementById('recordSlotId').value
            });

            event.target.reset();
            showMessage('Vehicle entry recorded successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    async function vehicleExit(id) {
        try {
            const result = await api(`/api/records/${id}/exit`, 'POST');

            showMessage(
                `${result.message || 'Vehicle exit recorded'}. Parking fee: ₹${result.parking_fee ?? 0}`
            );

            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    async function deleteRecord(id) {
        if (!confirm('Delete this parking record?')) return;

        try {
            await api(`/api/records/${id}`, 'DELETE');
            showMessage('Parking record deleted successfully!');
            await refreshAll();
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    // REFRESH ALL DATA

    async function refreshAll() {
        try {
            await Promise.all([
                loadUsers(),
                loadVehicles(),
                loadSlots(),
                loadRecords()
            ]);
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    refreshAll();
});
