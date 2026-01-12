import User from "../config/database.js";

export async function findOrCreateOAuthUser({
  email,
  name,
  avatar,
  provider,
  providerId,
}) {
  if (!email) {
    throw new Error("Email is required");
  }

  try {
    // Try to find existing user by provider ID
    let user = await User.findOne({ [`${provider}Id`]: providerId });

    if (user) {
      // User exists with this provider - update their info
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
      user.email = email || user.email;
      await user.save();
      console.log(`User found by ${provider}Id, updated info`);
      return user;
    }

    // Check if user exists by email (to link OAuth account)
    user = await User.findOne({ email });

    if (user) {
      // IMPORTANT: Link this OAuth provider to existing account
      user[`${provider}Id`] = providerId; // ← This was missing or not working
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
      await user.save();
      console.log(
        `Linked ${provider} account to existing user with email: ${email}`
      );
      return user;
    }

    // Create new user
    user = await User.create({
      email,
      name,
      avatar,
      [`${provider}Id`]: providerId,
    });

    console.log(`Created new user with ${provider}`);
    return user;
  } catch (error) {
    console.error("Error in findOrCreateOAuthUser:", error);
    throw error;
  }
}
