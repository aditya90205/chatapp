import VerifyOtp from "@/components/VerifyOtp";
import Loading from "@/components/Loading";
import { Suspense } from "react";

const VerifyPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyOtp />
    </Suspense>
  );
};

export default VerifyPage;
