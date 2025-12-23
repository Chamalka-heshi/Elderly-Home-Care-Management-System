 export type UserRole = 'admin' | 'doctor' | 'caregiver' | 'family';

export interface SignupRequest {
  full_name: string;
  email: string;
  contact_number: string;
  password: string;
  role: UserRole;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  access_token: string;
  email: string;
  role: UserRole;
  full_name: string;
}


export const signup = async (
  data: SignupRequest
): Promise<{ message: string }> => {
  const res = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData: { message?: string } = await res.json();
    throw new Error(errorData.message || 'Signup failed');
  }

  return res.json();
};


export const signin = async (
  data: SigninRequest
): Promise<SigninResponse> => {
  const res = await fetch('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const responseData: SigninResponse & { message?: string } =
    await res.json();

  if (!res.ok) {
    throw new Error(responseData.message || 'Signin failed');
  }

  return responseData;
};


export const signout = async (
  setUser: (user: SigninResponse | null) => void,
  navigate: (path: string) => void
): Promise<void> => {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
    navigate('/signin');
  } catch (err) {
    console.error(err);
  }
};

export const deleteAccount = async (email: string): Promise<{ message: string }> => {
  const res = await fetch('/auth/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });

  const data: { message?: string } = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete account');
  }

  return { message: data.message || 'Account deleted successfully' };
};

