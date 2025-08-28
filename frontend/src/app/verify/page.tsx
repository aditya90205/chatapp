"use client";
import axios from "axios";
import { ArrowRight, ChevronLeft, Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";

const VerifyPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  const searchParams = useSearchParams();

  const email: string = searchParams.get("email") || "";

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleInputChange = (index: number, value: string): void => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const digits = pasteData.replace(/\D/g, ""); // Remove non-digit characters
    if (digits.length === 6) {
      setOtp(digits.split(""));
      inputRefs.current[5]?.focus();
      setError("");
    } else {
      setError("Invalid OTP");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Invalid OTP");
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/v1/user/verify`,
        { email, otp: otpCode }
      );
      alert(data.message);
      Cookies.set("token", data.token, {
        expires: 15, // 15 days
        secure: false,
        path: "/",  // Set the cookie path to the root (/) means it will be accessible throughout the application
      });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setError(
        error.response?.data.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");

    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/v1/user/resend-otp`,
        { email }
      );
      alert(data.message);
      setTimer(60);
    } catch (error: any) {
      setError(
        error.response?.data.message || "An error occurred. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <div className="text-center mb-8 relative">
            <button
              className="absolute top-0 left-0 p-2 text-gray-300 hover:text-white"
              onClick={() => router.push("/login")}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Verify Your Email
            </h1>
            <p className="text-gray-300 text-lg">
              We have sent a 6 digit verification code to
            </p>
            <p className="text-blue-400 text-sm">{email}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Enter your 6 digit OTP here
              </label>
              <div className="flex justify-center items-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    ref={(el: HTMLInputElement | null) => {
                      inputRefs.current[index] = el;
                    }}
                    className="w-12 h-12 text-center text-xl font-bold rounded-lg bg-gray-700 text-white border-2 border-gray-600 "
                  />
                ))}
              </div>
            </div>
            {error && (
              <div className="bg-red-500 border border-red-700 p-3 rounded-lg">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Verify</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-4">
              Didn&apos;t receive the OTP?
            </p>
            {timer > 0 ? (
              <p className="text-gray-400 text-sm mb-4">{`Resend OTP in ${timer} seconds`}</p>
            ) : (
              <button
                className="text-blue-300 hover:text-blue-400 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleResendOtp}
                disabled={resendLoading}
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
