require("dotenv").config();

const axios = require("axios");

async function test() {
    try {
        const res = await axios.get(
            `${process.env.PORTAINER_URL}/endpoints`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PORTAINER_TOKEN}`,
                },
            }
        );

        console.log(res.data);

    } catch (err) {

        console.log("MESSAGE:", err.message);
        console.log("CODE:", err.code);

        if (err.response) {
            console.log("STATUS:", err.response.status);
            console.log(err.response.data);
        }

        if (err.cause) {
            console.log("CAUSE:", err.cause);
        }
    }
}

test();
