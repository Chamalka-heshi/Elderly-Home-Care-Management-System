/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FAMILY,
  })
  role: UserRole;

  // ── Common profile fields ─────────────────────────────────────────────────
  @Column()
  fullName: string;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ default: true })
  isActive: boolean;


  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  // ── Firebase / OAuth fields ───────────────────────────────────────────────

  /**
   * Firebase UID from the decoded ID token.
   * Unique per Firebase project — used to link Google / Facebook sign-ins.
   */
  @Column({ type: 'varchar', nullable: true, unique: true, name: 'firebase_uid' })
  firebaseUid: string | null;

  /**
   * Profile picture URL (OAuth provider) or base64 data-URL (custom upload).
   * Stored as TEXT so it can hold full base64-encoded images.
   */
  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  /** Set to the current time on every logout. The JWT guard rejects any
   *  token whose `iat` (issued-at) is older than this value, instantly
   *  invalidating all sessions without a separate blacklist table. */
  @Column({ type: 'timestamptz', nullable: true, name: 'last_logout_at' })
  lastLogoutAt: Date | null;

  // ── Timestamps ────────────────────────────────────────────────────────────
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}