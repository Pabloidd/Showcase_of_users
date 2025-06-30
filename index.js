const express = require('express');
const fs = require('fs');
const app = express();
const cors = require('cors');
const PORT = 3001;

const USERS_PER_PART = 15;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // Разрешить только фронтенд с порта 3000
}));

app.get('/users', (req, res) => {
    const start = parseInt(req.query.start); // Получаем параметр currentPart из запроса (элемент, с которого начинать)

    if (isNaN(start) || start < 0) {
        return res.status(400).json({ error: 'Invalid start parameter. Must be a non-negative number.' });
    }

    fs.readFile('data/Users.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Data Base mistake' });
        }

        try {
            const users = JSON.parse(data);
            const startIndex = start * USERS_PER_PART; // Рассчитываем индекс, с которого начинать
            const endIndex = startIndex + USERS_PER_PART;
            const usersToSend = users.slice(startIndex, endIndex);

            res.json(usersToSend);
        } catch (parseError) {
            console.error(parseError);
            return res.status(500).json({ error: 'Parsing mistake' });
        }
    });
});

//Обработчик PUT запросов, как один из вариантов решения задачи.
app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    fs.readFile('data/Users.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        try {
            let users = JSON.parse(data);
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Обновляем только разрешенные поля
            const updatedUser = {
                ...users[userIndex],
                FIO: req.body.FIO,
                post: req.body.post,
                address: req.body.address,
                age: Number(req.body.age),
                salary: Number(req.body.salary),
                haveINN: Boolean(req.body.haveINN),
                INN: req.body.haveINN ? Number(req.body.INN) : null
            };

            users[userIndex] = updatedUser;

            fs.writeFile('data/Users.json', JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Save failed' });
                }
                res.json(updatedUser);
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Processing error' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
