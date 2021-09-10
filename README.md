# Crypo-Store ![Workflow](https://github.com/birthdates/Crypto-Store/actions/workflows/build.yml/badge.svg)

This is a NextJS application that uses [CoinPayments](https://www.coinpayments.net/) to ensure secure crypto payments in a lot of different crypocurrencies.

It works with both Buycraft (requires Enterprise plan) & Crafting Store (requires Silver plan) via giftcards.

# Instructions

If you are going to use the Docker container, you can do:

```
git clone https://github.com/birthdates/Crypo-Store.git .
docker build -t crypo-site .
docker run -p 3000:3000 -t crypo-site
```

However if you aren't going to use the Docker container, you can manually run the server via setting the environment variables that you can find in the Dockerfile then run: `node server.js`.

The SSL certificates are stored in `/certs`.

# Environment Variables

- `TEBEX_SECRET` - Set this to your Tebex secret if you are going to use Tebex.
- `CRAFTING_STORE_SECRET` Set this to your Crafting Store secret if you are going to use Crafting Store.
- `COIN_KEY` - Your CoinPayment public API key (used for API requests)
- `COIN_SECRET` - Your CoinPayment private API key (used for HMAC validation)
- `COIN_MERCHANT_ID` - Your CoinPayment merchant ID (used for validation)
- `COIN_IPN_SECRET` - Your CoinPayment IPN secret (used for HMAC validation)

# CoinPayment API Permissions

There are a few required non-default permissions your API key will require:

- `get_tx_info` - For getting the transaction information (only on create)
- `create_transaction` - Creating a secure transaction

# CoinPayment Instant Payment Notifications

This project makes use CoinPayment's IPN system. In your account settings, you can set your IPN url to `https://yoursite.com/api/validateStatus/` for it to work.

# Supported Currencies

Here's a list of implemented cryptocurrencies:

- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Dogecoin (DOGE)
- Binance (BNB)
- Monero (XMR)
- Tether (USDT)
- Ripple (XRP)

## How can I add/remove a cryptocurrency?

First, you will need to support the currency in your CoinPayment settings.

Then, you can put a picture (icon, edge-to-edge), of the icon in the `public/icons/CURRENCY_SHORT.png` (example: `public/icons/BTC.png` is Bitcoin).

Then you can add an option to the dropdown list like: `{ name: "Bitcoin", id: "BTC" }`. To remove a cryptocurrency, do the reverse.

## How can I make a test transaction?

When in the development environment, the Litecoin Testnet coin will be available when creating a transaction. You can receive testnet coins from many online facuets including CoinPayments. With this you can test transactions and your IPN url.

# Styling

The current styling of the website is very barren as it's meant to be designed to your liking (i.e your logo, background, navbar).
