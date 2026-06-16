import EmailVerification from "../components/VerifyForm";

const VerifyPage = () => {
  return (
    <EmailVerification
      email="doctor@hospital.com"
      timer={43}
      isLoading={false}
      onResend={() => console.log("resend")}
    />
  );
};

export default VerifyPage;
