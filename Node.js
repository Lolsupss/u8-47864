const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Exemplo de lista de keys válidas
const validKeys = ['abc123', 'minhaKey', 'testekey'];

app.get('/verify', (req, res) => {
    const key = req.query.key;

    if (!key) {
        return res.status(400).send('Key não fornecida.');
    }

    if (validKeys.includes(key)) {
        return res.status(200).send('valid');
    } else {
        return res.status(403).send('invalid');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
