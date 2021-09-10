import { faClipboard } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Loading from "../components/Loading";
import { formatCurrency } from "../utils/locale";
import { TransactionWithStatus } from "../utils/transaction";

const Transaction: NextPage = () => {
  // States
  const router = useRouter();
  const [status, setStatus] = useState<TransactionWithStatus>(null as any);
  const [conversion, setConversion] = useState<number>(null as any);
  const [loading, setLoading] = useState(false);

  /*
    Fetch our current transaction and if we don't have one, redirect to main page.
    If we do have one, fetch the conversion rate.
  */
  useEffect(() => {
    const fetchStatus = () => {
      fetch("/api/transactionStatus")
        .then((res) => {
          if (res.status !== 200) throw "Fail";
          return res.json();
        })
        .then((data: TransactionWithStatus) => {
          setStatus(data);
          fetch(`/api/conversion?currency=${data.currency}`)
            .then((data) => data.json())
            .then((data) => setConversion(data.conversion));
        })
        .catch(() => router.push("/"));
    };

    const interval = setInterval(fetchStatus, 10000);
    fetchStatus();
    return () => clearInterval(interval);
  }, []);

  // Cancel our current transaction then redirect to the main page.
  const cancel = () => {
    setLoading(true);
    fetch("/api/cancelTransaction", {
      method: "DELETE",
    }).then(() => {
      router.push("/");
      setLoading(false);
    });
  };

  return (
    <div className="w-full h-full flex justify-center justify-items-center items-center overflow-hidden relative">
      <Header title="Crypto Exchange Transaction" />
      <div className="bgImage"></div>
      {status && conversion && (
        <div className="relative z-10 flex flex-col shadow w-full lg:w-1/4 md:w-1/2 text-white bgPrimary p-6 rounded-lg">
          <Loading loading={loading} />
          <span className="font-bold text-lg">YOUR TRANSACTION</span>
          <span className="font-light text-sm">#{status.id}</span>
          <div className="flex flex-row mt-3">
            <div className="flex flex-col w-max flex-1">
              <span className="text-gray-400 w-max">You send</span>
              <span className="font-bold w-max">
                {formatCurrency(status.amount)} {status.currency}
              </span>
            </div>
            <div className="flex flex-col w-max">
              <span className="text-gray-400 w-max">You receive</span>
              <span className="font-bold w-max">
                {formatCurrency(conversion * status.amount)} USD
              </span>
            </div>
          </div>
          <hr className="bg-gray-700 my-3"></hr>
          <span className="text-sm text-gray-400">Exchange Rate</span>
          <span className=" font-medium text-green-500">
            {`${formatCurrency(1 / conversion)} ${status.currency}`} = 1 USD
          </span>
          <hr className="bg-gray-700 my-3"></hr>
          <div className="flex flex-row">
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Transaction Status</span>
              <div>
                <span className="font-bold text-md">
                  {status.status_text} (received {status.received}{" "}
                  {status.currency})
                </span>
                {status.card && typeof status.card === "string" && (
                  <span className="ml-3 block">Gift Card: {status.card}</span>
                )}
              </div>
            </div>

            <button
              className="bg-red-800 rounded-md p-2 font-bold ml-auto hover:opacity-80 transition-opacity"
              onClick={cancel}
            >
              {status.status === -1 ||
              status.status === -2 ||
              status.status === 100 ||
              status.status === 2
                ? "CLOSE"
                : "CANCEL"}
            </button>
          </div>
          <div className="w-full flex flex-col p-5 rounded-md bgSecondary mt-3">
            <span className="text-gray-400 w-max">You send</span>
            <span className="font-bold w-max">
              {formatCurrency(status.amount)} {status.currency}
            </span>
            <span className="text-gray-400 w-max">To payment address</span>
            <div
              className="select-none cursor-pointer hover:opacity-70 transition-opacity text-green-500 font-light flex justify-around flex-row"
              onClick={() => navigator.clipboard.writeText(status.wallet)}
            >
              <FontAwesomeIcon
                icon={faClipboard}
                className="mr-1 md:hidden lg:inline-block"
              />
              <span className="overflow-ellipsis whitespace-nowrap w-full inline-block overflow-hidden">
                {status.wallet}
              </span>
            </div>
            <div className="w-full justify-center justify-items-center">
              <img
                src="/api/transactionImage"
                alt="Transaction QR Code"
                aria-label="Transaction QR Code"
                className="ml-auto mr-auto w-1/3 mt-3"
              />
            </div>
            <footer className="text-gray-400 text-xs w-full text-center mt-2">
              Please send the exact amount from your wallet or exchange account
              to the payment address.
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transaction;
