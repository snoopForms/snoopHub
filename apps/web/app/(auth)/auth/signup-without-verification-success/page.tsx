import BackToLoginButton from "@/app/(auth)/auth/components/BackToLoginButton";
import FormWrapper from "@/app/(auth)/auth/components/FormWrapper";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@formbricks/lib/authOptions";

export default async function SignupWithoutVerificationSuccess() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(`/`);
  }
  return (
    <FormWrapper>
      <h1 className="leading-2 mb-4 text-center font-bold">User successfully created</h1>
      <p className="text-center">
        Your new user has been created successfully. Please click the button below and sign in to your
        account.
      </p>
      <hr className="my-4" />
      <BackToLoginButton />
    </FormWrapper>
  );
}
