import {
  faAngleDown,
  faCopyright,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import type { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import { useEffect, useRef, useState } from "react";
import { DropDown, DropDownItem } from "../components/DropDown";
import { formatCurrency } from "../utils/locale";
import Header from "../components/Header";
import Loading from "../components/Loading";
import Link from "next/link";
import Image from "next/image";

type Currency = {
  short: string;
  name: string;
};

const Home: NextPage = () => {
  const currencyOptions: Array<DropDownItem> = [
    { name: "Bitcoin", id: "BTC" },
    { name: "Ethereum", id: "ETH" },
    { name: "Litecoin", id: "LTC" },
    { name: "Dogecoin", id: "DOGE" },
    { name: "Binance", id: "BNB" },
    { name: "Monero", id: "XMR" },
    { name: "Tether", id: "USDT" },
    { name: "Ripple", id: "XRP" },
  ];

  if (process.env.NODE_ENV !== "production")
    currencyOptions.push({ name: "Litcoin Test", id: "LTCT" });

  // Current selected currency (input)
  const [currency, setCurrency] = useState<Currency>({
    short: "BTC",
    name: "Bitcoin",
  });

  // Try to find cached currency option
  useEffect(() => {
    const persistentCurrency = localStorage.getItem("currency");
    if (!persistentCurrency) return;
    const jsonCurrency = JSON.parse(persistentCurrency);
    if (!jsonCurrency) return;
    setCurrency(jsonCurrency);
  }, []);

  // States
  const [showDropDown, setShowDropDown] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<any>(null);
  const [errorTimeout, setErrorTimeout] = useState<any>(null);
  const [loading, setLoading] = useState("none");
  const [hasTransaction, setHasTransaction] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Try to fetch if we already have an open transaction
  useEffect(() => {
    fetch("/api/transactionStatus")
      .then((data) => data.json())
      .then((data) => {
        setHasTransaction(!!data && !data.error);
      })
      .catch(() => {});
  }, []);

  // Ref for the USD & Crypto input
  const usdRef = useRef<HTMLInputElement>();
  const cryptoRef = useRef<HTMLInputElement>();

  // Set our selected currency and cache it
  const setCurrencyPersistent = (currency: Currency) => {
    setCurrency(currency);
    localStorage.setItem("currency", JSON.stringify(currency));
  };

  // Encode form data for application/x-www-form-urlencoded
  const encodeForm = (formData: FormData): string => {
    var output = "";
    function encode(str: string) {
      return encodeURIComponent(str).replace(/%20/g, "+");
    }
    const entries = formData.entries();
    let val = entries.next();
    while (!val.done) {
      const pair = val.value;
      if (typeof pair[1] == "string") {
        output += (output ? "&" : "") + encode(pair[0]) + "=" + encode(pair[1]);
      }
      val = entries.next();
    }
    return output;
  };

  // Send an error via an alert box
  const sendError = (message: string) => {
    setError(message);
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }
    setErrorTimeout(
      setTimeout(() => {
        setError(null);
        setErrorTimeout(null);
      }, 5000)
    );
  };

  // Called on submit, submit our current form data
  const onSubmit = async (event: any) => {
    event.preventDefault();
    setLoading("form");
    let res;
    try {
      res = await fetch(event.target.action, {
        method: event.target.method,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: encodeForm(new FormData(event.target)),
      });
    } catch (err) {
      sendError("Failed to exchange your currency!");
      setLoading("none");
      return;
    }
    const data = await res.json();
    setLoading("none");
    if (data.error) {
      console.error("Failed to create a transaction:", data.error);
      sendError(data.error);
      return;
    }

    router.push("/transaction");
  };

  // Timeout until we update the currency input (USD or Crypto)
  let inputTimeout = useRef<NodeJS.Timeout>(null as any);
  const onInputChange = async (
    value: number,
    to: string,
    element: HTMLInputElement,
    usd: boolean
  ) => {
    if (isNaN(value) || value <= 0) return;
    if (inputTimeout.current) clearTimeout(inputTimeout.current);
    inputTimeout.current = setTimeout(async () => {
      let conversion: number;
      try {
        setLoading(!usd ? "usd" : "crypto");
        const res = await fetch(`/api/conversion?currency=${to}`);
        const data = await res.json();
        conversion = parseFloat(data.conversion);
      } catch (err) {
        sendError("We failed to convert your input.");
        setLoading("none");
        return;
      }
      setLoading("none");
      element.value = formatCurrency(
        usd ? value / conversion : value * conversion
      );
    }, 500);
  };

  return (
    <div className="w-full h-full flex flex-row justify-center justify-items-center items-center overflow-hidden relative">
      <Header title="Crypto Store Exchange" />
      <div className="bgImage"></div>
      <form
        action="/api/createTransaction"
        method="POST"
        onSubmit={onSubmit}
        className="relative z-10 shadow xl:w-1/4 w-full lg:w-1/2 text-white text-center bgPrimary p-5 rounded-lg"
      >
        {hasTransaction && (
          <Link href="/transaction">
            <div className="cursor-pointer">
              <div
                className="absolute top-4 right-3 text-5xl text-yellow-300"
                onMouseOver={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <FontAwesomeIcon icon={faExclamationCircle} />
              </div>
              <span
                className={clsx(
                  "absolute -top-3 -right-52 bg-gray-600 p-3 rounded-md text-white text-sm",
                  {
                    hidden: !showTooltip,
                  }
                )}
              >
                You have an open transaction!
              </span>
            </div>
          </Link>
        )}
        <Loading loading={loading === "form"} />
        <span className="font-bold text-xl">EXCHANGE CRYPTO</span>
        <p className="text-gray-400 text-sm mb-4">FOR STORE CREDIT</p>
        {error && (
          <div className="border-2 font-medium border-red-800 bg-red-500 p-3 text-gray-100 bg-opacity-80 rounded-md mb-3 flex flex-col">
            <span className="text-xs text-gray-300 font-normal">
              There was an issue with your transaction:
            </span>
            {error}
          </div>
        )}
        <div className="relative select-none flex flex-col bgSecondary rounded-md p-3 text-left">
          <Loading loading={loading === "crypto"} />
          <p className="text-gray-400 text-sm w-max absolute">You send</p>
          <div className="flex flex-row">
            <input
              autoComplete="off"
              type="number"
              ref={cryptoRef as any}
              min="0"
              step="0.000000000000000001"
              onChange={(event) =>
                onInputChange(
                  parseFloat(event.target.value),
                  currency.short,
                  usdRef.current as any,
                  false
                )
              }
              className="mt-4 font-bold text-lg bg-transparent appearance-none focus:outline-none focus:shadow-outline flex-1"
            ></input>
            <div
              className={clsx("justify-end flex cursor-pointer", {
                "transition-opacity hover:opacity-60": !showDropDown,
              })}
              onClick={() => {
                setShowDropDown(true);
              }}
            >
              <div className="mr-3 text-right">
                <input
                  type="hidden"
                  value={currency.short}
                  name="currency"
                ></input>
                <p className="text-sm text-gray-400">{currency.name}</p>
                <span className="font-bold text-lg">{currency.short}</span>
              </div>
              <div className="relative justify-center items-center flex">
                <FontAwesomeIcon icon={faAngleDown} />
                {showDropDown && (
                  <div className="absolute top-5 lg:top-8 right-0 lg:right-0 lg:left-2 w-52 z-40">
                    <DropDown
                      close={() => setShowDropDown(false)}
                      setOtherValue={(val) => {
                        if (val.id === currency.short) return;
                        setCurrencyPersistent({
                          short: val.id,
                          name: val.name,
                        });
                        onInputChange(
                          cryptoRef.current?.value as any,
                          val.id,
                          usdRef.current as any,
                          false
                        );
                      }}
                      options={currencyOptions}
                      defaultValue={currency.short}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 relative flex flex-col bgSecondary rounded-md p-3 text-left">
          <Loading loading={loading === "usd"} />
          <p className="text-gray-400 text-sm w-max absolute">
            You receive approximately
          </p>
          <div className="flex flex-row">
            <input
              autoComplete="off"
              type="number"
              min="0"
              step="0.000000000000000001"
              ref={usdRef as any}
              name="amount"
              onChange={(event) =>
                onInputChange(
                  parseFloat(event.target.value),
                  currency.short,
                  cryptoRef.current as any,
                  true
                )
              }
              required
              className="mt-4 font-bold text-lg bg-transparent appearance-none focus:outline-none focus:shadow-outline flex-1"
            ></input>
            <div className="justify-end mr-3 text-right select-none">
              <p className="text-sm text-gray-400">Store Credit</p>
              <span className="font-bold text-lg">USD</span>
            </div>
          </div>
        </div>
        <input
          name="email"
          type="email"
          required
          placeholder="Your email address"
          className="w-full mt-3 relative flex flex-col bgSecondary rounded-md p-3 text-left focus:outline-none"
        ></input>
        <button
          type="submit"
          className={clsx(
            "w-full bg-green-600 p-3 font-bold rounded-md mt-5 block",
            {
              "hover:opacity-90 transition-opacity ": !hasTransaction,
              "opacity-50 cursor-not-allowed": hasTransaction,
            }
          )}
          disabled={hasTransaction}
        >
          EXCHANGE
        </button>
      </form>
      <div className="ml-44 z-0 text-center text-white hidden xl:flex flex-col justify-center justify-items-center items-center self-center">
        <span className="font-bold text-3xl">Purchase using crypto</span>
        <p className="mt-3 text-md text-gray-400 block w-72 text-center">
          A fast and secure way to purchase anything on our store using{" "}
          {currencyOptions.length} popular cryptocurrencies. Fully automated
          with no verification required.
        </p>
        <div className="flex flex-row justify-center mt-5">
          {currencyOptions.map((currency) => (
            <div className="ml-2" key={currency.id}>
              <Image
                width="32px"
                height="32px"
                src={`/icons/${currency.id}.png`}
                alt={currency.name}
              />
            </div>
          ))}
        </div>
      </div>
      <footer className="select-none z-0 absolute bottom-5 font-medium opacity-50 text-gray-800 flex flex-row justify-center items-center justify-items-center">
        <FontAwesomeIcon className="text-xl lg:text-4xl" icon={faCopyright} />
        <div className="flex flex-col">
          <span className="ml-4 text-sm md:text-md">
            COPYRIGHT 2021 <b>Liam</b>
            <br />
            WE ARE NOT AFFILIATED WITH MOJANG AB.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
