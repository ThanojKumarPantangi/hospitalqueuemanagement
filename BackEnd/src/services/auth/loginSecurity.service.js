export const handlePasswordFailure = async (user, security) => {
  security.failedLoginAttempts = (security.failedLoginAttempts || 0) + 1;
  await security.save();

  const attempts = security.failedLoginAttempts;

  let delay;
  if (user.role === "ADMIN") {
    delay = Math.min(2000 * Math.pow(2, attempts - 1), 120000);
  } else if (user.role === "DOCTOR") {
    delay = Math.min(1500 * Math.pow(2, attempts - 1), 90000);
  } else {
    delay = Math.min(1000 * Math.pow(2, attempts - 1), 60000);
  }

  await new Promise(resolve => setTimeout(resolve, delay));
  throw new Error("Invalid Credentials");
};

export const resetFailedAttempts = async (security) => {
  if (security.failedLoginAttempts > 0) {
    security.failedLoginAttempts = 0;
    await security.save();
  }
};