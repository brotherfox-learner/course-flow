import Omise from "omise";

const omise = Omise({
  secretKey: process.env.OMISE_SECRET_KEY,
});

export default omise;
