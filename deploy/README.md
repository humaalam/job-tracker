# Deploying to AWS

Step-by-step notes for Phase 12 of [docs/SPEC.md](../docs/SPEC.md). Each section matches one step and is filled in when we reach it.

Target setup: the server runs in Docker on **EC2** (image stored in **ECR**), the database is **RDS PostgreSQL 17**, and the React build is served from **S3** through **CloudFront**, which also forwards `/api/*` to EC2.

## Step 1: AWS basics

Goal: a safe way to log in, a fixed region, and an email alert before you spend money.

### 1. Secure the root user

The **root user** is the email address you signed up with. It can do everything, including closing the account, so you use it only for a few account-level tasks.

1. Sign in as root at <https://console.aws.amazon.com/>.
2. Top right: your account name → **Security credentials** → **Assign MFA device**.
3. Choose a **passkey** or an **authenticator app** (Google Authenticator, Microsoft Authenticator, 1Password...). Scan the QR code and enter two codes in a row.
4. On the same page, check that there are **no access keys** for root. Never create any.

### 2. Let IAM users see billing

By default, only root can see costs and budgets, even for admin users.

1. Still as root: account name → **Account**.
2. Scroll to **IAM user and role access to Billing information** → **Edit** → tick **Activate IAM Access** → **Update**.

### 3. Create your admin IAM user

You'll use this user every day from now on.

1. Open **IAM** → **Users** → **Create user**.
2. User name: e.g. `huma-admin`. Tick **Provide user access to the AWS Management Console** → **I want to create an IAM user** → choose a custom password and untick "must create a new password".
3. Permissions: **Attach policies directly** → tick **AdministratorAccess** → create the user.
4. Copy the **Console sign-in URL** (`https://<account-id>.signin.aws.amazon.com/console`) and bookmark it.
5. Open the new user → **Security credentials** → **Assign MFA device** (same as for root).
6. Sign out, then sign in again with the bookmarked URL as `huma-admin`. **Owner login for website , huma-admin for the CLI only**

Don't create access keys yet. The AWS CLI needs them in Step 5 (pushing to ECR).

### 4. Pick one region

A **region** is a group of AWS data centers in one area (e.g. `eu-west-2` = London). Most resources live in a single region and are invisible from others, which makes "where did my EC2 instance go?" a classic beginner moment.

- Choose the region closest to you and your users. Use it for **all** resources in this project: RDS, EC2, ECR and S3.
- Set it in the region dropdown at the top right of the console.
- CloudFront, IAM and Budgets are **global**, so they show "Global" instead of a region. That's normal.

Chosen region: `eu-north-1` (record it here and in the SPEC decision note).

### 5. Budget alerts

AWS charges after the fact, so alerts are your safety net. They **warn** you; they don't stop resources.

1. Open **Billing and Cost Management** → **Budgets** → **Create budget** → **Use a template**.
2. Create a **Zero spend budget**: it emails you as soon as anything costs more than $0.01.
3. Create a second budget, **Monthly cost budget**, with an amount such as **$10**. AWS adds alerts at 85% and 100% actual spend, plus 100% forecasted.
4. Use the same email for both, and confirm any email AWS sends.
5. **Billing preferences** → **Alert preferences** → turn on **Receive AWS Free Tier alerts**.

Check what your account's free offer covers under **Billing and Cost Management** → **Free Tier**. Accounts created since July 2025 get credits on a "free plan"; older accounts have the 12-month free tier. Some costs fall outside both, for example **public IPv4 addresses** (about $3.60/month each). We'll go through these in Step 8.

### Checklist

- [x] Root (Owner) has MFA and no access keys
- [x] IAM access to billing: not available in new console (Free plan); I check billing as Owner
- [x] `huma-admin` exists with AdministratorAccess, CLI only (no console access in new console); access key comes in Step 5
- [x] Region chosen: `eu-north-1` (Stockholm), locked by the Free plan
- [x] Zero-spend budget and monthly budget ($10) created, emails confirmed
- [ ] Free Tier alerts on (not found in new console; using budgets + Free Tier page instead)
