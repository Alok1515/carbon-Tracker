import mongoose, { Schema, Document, Model } from 'mongoose';

// User interface
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Session interface
export interface ISession extends Document {
  _id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
}

// Account interface
export interface IAccount extends Document {
  _id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Verification interface
export interface IVerification extends Document {
  _id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Emissions interface
export interface IEmissions extends Document {
  userId: string;
  type: string;
  category: string;
  value: number;
  unit: string;
  co2: number;
  createdAt: string;
}

// UserStats interface
export interface IUserStats extends Document {
  userId: string;
  totalEmissions: number;
  monthlyEmissions: number;
  rank: number;
  treesEquivalent: number;
  lastCalculated: string;
  hasLoggedEmissions: boolean;
}

// TreePlantings interface
export interface ITreePlantings extends Document {
  userId: string;
  treesPlanted: number;
  plantingDate: string;
  notes?: string;
  createdAt: string;
}

// Badge interface
export interface IBadge extends Document {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  category: string;
  createdAt: string;
}

// UserBadge interface
export interface IUserBadge extends Document {
  userId: string;
  badgeId: string;
  progress: number;
  earned: boolean;
  earnedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// DailyQuest interface
export interface IDailyQuest extends Document {
  questId: string;
  title: string;
  description: string;
  category: string;
  points: number;
  icon: string;
  requirement: number;
  action: string; // e.g., 'log_emissions', 'reduce_emissions', 'visit_dashboard'
  isActive: boolean;
  createdAt: string;
}

// UserDailyQuest interface
export interface IUserDailyQuest extends Document {
  userId: string;
  questId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: string;
  date: string; // YYYY-MM-DD format
  pointsEarned: number;
  createdAt: string;
  updatedAt: string;
}

// ShopItem interface
export interface IShopItem extends Document {
  itemId: string;
  name: string;
  description: string;
  type: 'avatar_frame' | 'title';
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  imageUrl?: string;
  cssClass?: string;
  metadata?: any;
  isActive: boolean;
  createdAt: string;
}

// UserInventory interface
export interface IUserInventory extends Document {
  userId: string;
  itemId: string;
  purchasedAt: string;
  equipped: boolean;
}

// UserProfile interface
export interface IUserProfile extends Document {
  userId: string;
  accountType: 'individual' | 'company' | 'city';
  equippedFrame?: string;
  equippedTitle?: string;
  displayName?: string;
  bio?: string;
  totalPointsEarned: number;
  totalPointsSpent: number;
  updatedAt: string;
}

// Friend interface
export interface IFriend extends Document {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  requestedBy: string;
  createdAt: string;
  acceptedAt?: string;
}

// Challenge interface
export interface IChallenge extends Document {
  challengeId: string;
  name: string;
  description: string;
  type: '1v1' | 'team' | 'group';
  goal: number;
  metric: 'reduction_percentage' | 'total_emissions' | 'days_active';
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  participants: string[];
  teams?: { teamId: string; name: string; members: string[] }[];
  winner?: string;
  createdAt: string;
}

// ChallengeProgress interface
export interface IChallengeProgress extends Document {
  challengeId: string;
  userId: string;
  teamId?: string;
  startEmissions: number;
  currentEmissions: number;
  reductionPercentage: number;
  lastUpdated: string;
}

// SocialPost interface
export interface ISocialPost extends Document {
  postId: string;
  userId: string;
  type: 'achievement' | 'tip' | 'milestone' | 'challenge';
  content: string;
  imageUrl?: string;
  metadata?: any;
  likes: string[];
  comments: { userId: string; text: string; createdAt: string }[];
  createdAt: string;
}

// Pledge interface
export interface IPledge extends Document {
  pledgeId: string;
  userId: string;
  title: string;
  description: string;
  targetReduction: number;
  deadline: string;
  startDate: string;
  baselineEmissions: number;
  status: 'active' | 'completed' | 'failed';
  supporters: string[];
  progress: number;
  createdAt: string;
  completedAt?: string;
}

// Message interface
export interface IMessage extends Document {
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

// User Schema
const userSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, required: true, default: false },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Session Schema
const sessionSchema = new Schema<ISession>({
  _id: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  userId: { type: String, required: true, ref: 'User' }
}, { _id: false });

// Account Schema
const accountSchema = new Schema<IAccount>({
  _id: { type: String, required: true },
  accountId: { type: String, required: true },
  providerId: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  accessToken: { type: String },
  refreshToken: { type: String },
  idToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  refreshTokenExpiresAt: { type: Date },
  scope: { type: String },
  password: { type: String },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true }
}, { _id: false });

// Verification Schema
const verificationSchema = new Schema<IVerification>({
  _id: { type: String, required: true },
  identifier: { type: String, required: true },
  value: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Emissions Schema
const emissionsSchema = new Schema<IEmissions>({
  userId: { type: String, required: true, ref: 'User' },
  type: { type: String, required: true },
  category: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  co2: { type: Number, required: true },
  createdAt: { type: String, required: true }
});

// UserStats Schema
const userStatsSchema = new Schema<IUserStats>({
  userId: { type: String, required: true, unique: true, ref: 'User' },
  totalEmissions: { type: Number, required: true, default: 0 },
  monthlyEmissions: { type: Number, required: true, default: 0 },
  rank: { type: Number, required: true, default: 0 },
  treesEquivalent: { type: Number, required: true, default: 0 },
  lastCalculated: { type: String, required: true },
  hasLoggedEmissions: { type: Boolean, required: true, default: false }
});

// TreePlantings Schema
const treePlantingsSchema = new Schema<ITreePlantings>({
  userId: { type: String, required: true, ref: 'User' },
  treesPlanted: { type: Number, required: true },
  plantingDate: { type: String, required: true },
  notes: { type: String },
  createdAt: { type: String, required: true }
});

// Badge Schema
const badgeSchema = new Schema<IBadge>({
  badgeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  requirement: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: String, required: true }
});

// UserBadge Schema
const userBadgeSchema = new Schema<IUserBadge>({
  userId: { type: String, required: true, ref: 'User' },
  badgeId: { type: String, required: true, ref: 'Badge' },
  progress: { type: Number, required: true, default: 0 },
  earned: { type: Boolean, required: true, default: false },
  earnedAt: { type: String },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
});

// DailyQuest Schema
const dailyQuestSchema = new Schema<IDailyQuest>({
  questId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  points: { type: Number, required: true },
  icon: { type: String, required: true },
  requirement: { type: Number, required: true },
  action: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: true },
  createdAt: { type: String, required: true }
});

// UserDailyQuest Schema
const userDailyQuestSchema = new Schema<IUserDailyQuest>({
  userId: { type: String, required: true, ref: 'User' },
  questId: { type: String, required: true, ref: 'DailyQuest' },
  progress: { type: Number, required: true, default: 0 },
  completed: { type: Boolean, required: true, default: false },
  claimed: { type: Boolean, required: true, default: false },
  completedAt: { type: String },
  date: { type: String, required: true }, // YYYY-MM-DD format
  pointsEarned: { type: Number, required: true, default: 0 },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
});

// ShopItem Schema
const shopItemSchema = new Schema<IShopItem>({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true, enum: ['avatar_frame', 'title'] },
  price: { type: Number, required: true },
  rarity: { type: String, required: true, enum: ['common', 'rare', 'epic', 'legendary'] },
  imageUrl: { type: String },
  cssClass: { type: String },
  metadata: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, required: true, default: true },
  createdAt: { type: String, required: true }
});

// UserInventory Schema
const userInventorySchema = new Schema<IUserInventory>({
  userId: { type: String, required: true, ref: 'User' },
  itemId: { type: String, required: true, ref: 'ShopItem' },
  purchasedAt: { type: String, required: true },
  equipped: { type: Boolean, required: true, default: false }
});

// UserProfile Schema
const userProfileSchema = new Schema<IUserProfile>({
  userId: { type: String, required: true, unique: true, ref: 'User' },
  accountType: { type: String, enum: ['individual', 'company', 'city'], required: true },
  equippedFrame: { type: String, ref: 'ShopItem' },
  equippedTitle: { type: String, ref: 'ShopItem' },
  displayName: { type: String },
  bio: { type: String },
  totalPointsEarned: { type: Number, required: true, default: 0 },
  totalPointsSpent: { type: Number, required: true, default: 0 },
  updatedAt: { type: String, required: true }
});

// Create indexes
sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 });
accountSchema.index({ userId: 1 });
emissionsSchema.index({ userId: 1 });
emissionsSchema.index({ createdAt: -1 });
userStatsSchema.index({ userId: 1 });
userStatsSchema.index({ rank: 1 });
treePlantingsSchema.index({ userId: 1 });

badgeSchema.index({ badgeId: 1 });
badgeSchema.index({ category: 1 });

userBadgeSchema.index({ userId: 1 });
userBadgeSchema.index({ badgeId: 1 });
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

dailyQuestSchema.index({ questId: 1 });
dailyQuestSchema.index({ isActive: 1 });

userDailyQuestSchema.index({ userId: 1 });
userDailyQuestSchema.index({ questId: 1 });
userDailyQuestSchema.index({ date: 1 });
userDailyQuestSchema.index({ userId: 1, date: 1 });
userDailyQuestSchema.index({ userId: 1, questId: 1, date: 1 }, { unique: true });

shopItemSchema.index({ itemId: 1 });
shopItemSchema.index({ type: 1 });
shopItemSchema.index({ isActive: 1 });

userInventorySchema.index({ userId: 1 });
userInventorySchema.index({ itemId: 1 });
userInventorySchema.index({ userId: 1, itemId: 1 }, { unique: true });

userProfileSchema.index({ userId: 1 });

// Friend Schema
const friendSchema = new Schema<IFriend>({
  userId: { type: String, required: true, ref: 'User' },
  friendId: { type: String, required: true, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'blocked'], required: true },
  requestedBy: { type: String, required: true, ref: 'User' },
  createdAt: { type: String, required: true },
  acceptedAt: { type: String }
});

// Challenge Schema
const challengeSchema = new Schema<IChallenge>({
  challengeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['1v1', 'team', 'group'], required: true },
  goal: { type: Number, required: true },
  metric: { type: String, enum: ['reduction_percentage', 'total_emissions', 'days_active'], required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  status: { type: String, enum: ['pending', 'active', 'completed', 'cancelled'], required: true },
  createdBy: { type: String, required: true, ref: 'User' },
  participants: [{ type: String, ref: 'User' }],
  teams: [{ 
    teamId: String, 
    name: String, 
    members: [{ type: String, ref: 'User' }] 
  }],
  winner: { type: String, ref: 'User' },
  createdAt: { type: String, required: true }
});

// ChallengeProgress Schema
const challengeProgressSchema = new Schema<IChallengeProgress>({
  challengeId: { type: String, required: true, ref: 'Challenge' },
  userId: { type: String, required: true, ref: 'User' },
  teamId: { type: String },
  startEmissions: { type: Number, required: true },
  currentEmissions: { type: Number, required: true },
  reductionPercentage: { type: Number, required: true },
  lastUpdated: { type: String, required: true }
});

// SocialPost Schema
const socialPostSchema = new Schema<ISocialPost>({
  postId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  type: { type: String, enum: ['achievement', 'tip', 'milestone', 'challenge'], required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  metadata: { type: Schema.Types.Mixed },
  likes: [{ type: String, ref: 'User' }],
  comments: [{
    userId: { type: String, ref: 'User' },
    text: String,
    createdAt: String
  }],
  createdAt: { type: String, required: true }
});

// Pledge Schema
const pledgeSchema = new Schema<IPledge>({
  pledgeId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetReduction: { type: Number, required: true },
  deadline: { type: String, required: true },
  startDate: { type: String, required: true },
  baselineEmissions: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'failed'], required: true },
  supporters: [{ type: String, ref: 'User' }],
  progress: { type: Number, required: true, default: 0 },
  createdAt: { type: String, required: true },
  completedAt: { type: String }
});

// Message Schema
const messageSchema = new Schema<IMessage>({
  senderId: { type: String, required: true, ref: 'User' },
  receiverId: { type: String, required: true, ref: 'User' },
  content: { type: String, required: true },
  createdAt: { type: String, required: true },
  read: { type: Boolean, default: false }
});

// Create indexes for social features
friendSchema.index({ userId: 1 });
friendSchema.index({ friendId: 1 });
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });
friendSchema.index({ status: 1 });

challengeSchema.index({ challengeId: 1 });
challengeSchema.index({ createdBy: 1 });
challengeSchema.index({ status: 1 });
challengeSchema.index({ participants: 1 });

challengeProgressSchema.index({ challengeId: 1 });
challengeProgressSchema.index({ userId: 1 });
challengeProgressSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

socialPostSchema.index({ postId: 1 });
socialPostSchema.index({ userId: 1 });
socialPostSchema.index({ createdAt: -1 });

pledgeSchema.index({ pledgeId: 1 });
pledgeSchema.index({ userId: 1 });
pledgeSchema.index({ status: 1 });

messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: 1 });

// Export models
// NOTE: better-auth stores auth users in collections like 'user', 'session', 'account', 'verification' (singular).
// We explicitly set these collection names to ensure compatibility with better-auth database adapter.

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema, 'users');
export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema, 'session');
export const Account: Model<IAccount> = mongoose.models.Account || mongoose.model<IAccount>('Account', accountSchema, 'account');
export const Verification: Model<IVerification> = mongoose.models.Verification || mongoose.model<IVerification>('Verification', verificationSchema, 'verification');
export const Emissions: Model<IEmissions> = mongoose.models.Emissions || mongoose.model<IEmissions>('Emissions', emissionsSchema);
export const UserStats: Model<IUserStats> = mongoose.models.UserStats || mongoose.model<IUserStats>('UserStats', userStatsSchema);
export const TreePlantings: Model<ITreePlantings> = mongoose.models.TreePlantings || mongoose.model<ITreePlantings>('TreePlantings', treePlantingsSchema);
export const Badge: Model<IBadge> = mongoose.models.Badge || mongoose.model<IBadge>('Badge', badgeSchema);
export const UserBadge: Model<IUserBadge> = mongoose.models.UserBadge || mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);
export const DailyQuest: Model<IDailyQuest> = mongoose.models.DailyQuest || mongoose.model<IDailyQuest>('DailyQuest', dailyQuestSchema);
export const UserDailyQuest: Model<IUserDailyQuest> = mongoose.models.UserDailyQuest || mongoose.model<IUserDailyQuest>('UserDailyQuest', userDailyQuestSchema);
export const ShopItem: Model<IShopItem> = mongoose.models.ShopItem || mongoose.model<IShopItem>('ShopItem', shopItemSchema);
export const UserInventory: Model<IUserInventory> = mongoose.models.UserInventory || mongoose.model<IUserInventory>('UserInventory', userInventorySchema);
export const UserProfile: Model<IUserProfile> = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', userProfileSchema);
export const Friend: Model<IFriend> = mongoose.models.Friend || mongoose.model<IFriend>('Friend', friendSchema);
export const Challenge: Model<IChallenge> = mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', challengeSchema);
export const ChallengeProgress: Model<IChallengeProgress> = mongoose.models.ChallengeProgress || mongoose.model<IChallengeProgress>('ChallengeProgress', challengeProgressSchema);
export const SocialPost: Model<ISocialPost> = mongoose.models.SocialPost || mongoose.model<ISocialPost>('SocialPost', socialPostSchema);
export const Pledge: Model<IPledge> = mongoose.models.Pledge || mongoose.model<IPledge>('Pledge', pledgeSchema);
export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);