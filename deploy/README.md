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

## Step 3: Docker image for the server

Goal: package the server as an image and prove that it works against the local database. Start Postgres first (`npm run db:up`), and run these from the repo root.

The build runs from the root, not `server/`, because the npm workspaces share one `package-lock.json`:

```bash
docker build -f server/Dockerfile -t job-tracker-server .
```

The container gets its settings from `-e` flags, because the image contains no `.env`. Inside Docker's network, the database's address is `db` (its Compose service name), not `localhost`.

Create the tables, using the image (safe to re-run; it only applies new migrations):

```bash
docker run --rm --network job-tracker_default -e DATABASE_URL=postgresql://jobtracker:jobtracker@db:5432/jobtracker -e JWT_SECRET=local-docker-test-secret-at-least-32-chars job-tracker-server npx prisma migrate deploy
```

Start the server at <http://localhost:4200> (a different port, so it doesn't clash with `npm run dev:server`):

```bash
docker run -d --rm --name job-tracker-server-test --network job-tracker_default -p 4200:4000 -e DATABASE_URL=postgresql://jobtracker:jobtracker@db:5432/jobtracker -e JWT_SECRET=local-docker-test-secret-at-least-32-chars job-tracker-server
```

Check it and stop it (`docker stop` should take about a second, because the server shuts down cleanly):

```bash
curl http://localhost:4200/api/health
docker logs job-tracker-server-test
docker stop job-tracker-server-test
```

The secret above is only for this local test. Production gets its own generated value in Step 5.

## Step 4: RDS database and security groups

Goal: a private PostgreSQL database that only our EC2 server can reach.

Before you start, check that the region at the top right is `eu-north-1`. Console labels change, so if a setting below is missing or named differently, stop and note what you see instead of guessing.

### 1. Create two security groups

A **security group** is a firewall around an AWS resource. Inbound traffic is blocked unless a rule allows it. Create them under **EC2** → **Security Groups** → **Create security group**, both in the **default VPC**:

| Name              | Description            | Inbound rules                                                        |
| ----------------- | ---------------------- | -------------------------------------------------------------------- |
| `job-tracker-app` | Job Tracker EC2 server | None for now (added in Step 5)                                       |
| `job-tracker-db`  | Job Tracker database   | Type **PostgreSQL** (port 5432), source: the `job-tracker-app` group |

Create `job-tracker-app` first, because the second group refers to it. Leave the outbound rules as they are.

### 2. Generate the database password

Run this on your PC. Hex is only letters and digits, so the password is safe inside `DATABASE_URL`:

```bash
node -e "console.log(require('crypto').randomBytes(18).toString('hex'))"
```

Save it in a password manager. **Never put it in this file, in Git or in a chat.**

### 3. Create the database

Open **Aurora and RDS** → **Databases** → **Create database**, and use these settings:

| Setting                                              | Value                                                |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Creation method                                      | **Full** (not Express or Restore from S3)            |
| Engine                                               | **PostgreSQL** (not Aurora), latest **17.x** version |
| Template                                             | **Free tier**                                        |
| DB instance identifier                               | `job-tracker-db`                                     |
| Master username                                      | `jobtracker`                                         |
| Credentials management                               | **Self managed**, with your generated password       |
| Instance class                                       | `db.t3.micro` or `db.t4g.micro`                      |
| Storage                                              | 20 GB, General Purpose SSD                           |
| Storage autoscaling                                  | **Off**                                              |
| Availability                                         | **Single-AZ** (one instance)                         |
| Compute resource                                     | **Don't connect to an EC2 compute resource**         |
| VPC                                                  | Default VPC                                          |
| Public access                                        | **No**                                               |
| VPC security group                                   | Choose existing: `job-tracker-db`. Remove `default`. |
| Performance Insights / Enhanced Monitoring           | **Off**, if offered                                  |
| Additional configuration → **Initial database name** | `jobtracker`                                         |
| Deletion protection                                  | **Off**, so the teardown in Step 8 is simple         |

Leave everything else as the template set it. Check that the estimated cost panel looks right, then create the database. It takes about 5–15 minutes to reach **Available**.

**Initial database name matters.** If it's blank, RDS only creates the built-in `postgres` database, and our migrations would have nowhere to go.

Charges against your credits start once the database exists, so it's best to move on to Step 5 soon.

### 4. Check the result

Open the database and confirm:

- Status is **Available**, and the region is `eu-north-1`.
- **Connectivity & security**: publicly accessible is **No**, and the security group is `job-tracker-db`.
- **Configuration**: DB name is `jobtracker`, and the engine version is 17.x.

Copy the **Endpoint** into your password manager next to the password. On the **Connectivity & security** tab, the view may start on **Code snippets**, which you can ignore; switch it to **Endpoints**. You'll need both in Step 5, which is also when we first connect. RDS on PostgreSQL 15+ requires encrypted connections, so `DATABASE_URL` will need SSL settings then.

### Checklist

- [x] `job-tracker-app` security group created, with no inbound rules
- [x] `job-tracker-db` security group allows 5432 only from `job-tracker-app`
- [x] Database password saved in a password manager
- [x] RDS instance is Available, on PostgreSQL 17.11, in `eu-north-1`
- [x] Publicly accessible is No, initial database name is `jobtracker`
- [x] Endpoint saved

## Step 5: Push the image to ECR and run it on EC2

Goal: the server running on EC2, connected to RDS.

### 1. AWS CLI on your PC

1. Install the AWS CLI from <https://awscli.amazonaws.com/AWSCLIV2.msi> and reopen VS Code.
2. In **IAM** → **Users** → `huma-admin` → **Security credentials**, create an access key for **Command Line Interface (CLI)**.
3. Run `aws configure` with that key, region `eu-north-1` and output `json`. Keys are stored in `.aws` in your user folder, never in this repo.
4. Check it: `aws sts get-caller-identity` should end in `user/huma-admin`.

### 2. Upload the image (PowerShell, on your PC)

```powershell
aws ecr create-repository --repository-name job-tracker-server --no-cli-pager
$ACCOUNT = aws sts get-caller-identity --query Account --output text
$REGISTRY = "$ACCOUNT.dkr.ecr.eu-north-1.amazonaws.com"
aws ecr get-login-password | docker login --username AWS --password-stdin $REGISTRY
docker tag job-tracker-server "$REGISTRY/job-tracker-server:v1"
docker push "$REGISTRY/job-tracker-server:v1"
```

### 3. Create the role and launch the server (AWS website)

**IAM** → **Roles** → **Create role** → AWS service, EC2. Attach `AmazonEC2ContainerRegistryReadOnly` and `AmazonSSMManagedInstanceCore`, and name it `job-tracker-ec2-role`.

**EC2** → **Launch instances**:

| Setting               | Value                                     |
| --------------------- | ----------------------------------------- |
| Name                  | `job-tracker-server`                      |
| Image                 | Amazon Linux 2023, 64-bit (x86)           |
| Instance type         | `t3.micro`                                |
| Key pair              | Proceed without a key pair                |
| Auto-assign public IP | Enable                                    |
| Security group        | Select existing: `job-tracker-app`        |
| IAM instance profile  | `job-tracker-ec2-role` (Advanced details) |

### 4. Set up the server (browser terminal)

Open it with **Instances** → tick the server → **Connect** → **Session Manager**. Run these one at a time. `read` waits for you to paste a value.

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker

ACCOUNT=$(aws sts get-caller-identity --region eu-north-1 --query Account --output text)
REGISTRY=$ACCOUNT.dkr.ecr.eu-north-1.amazonaws.com
aws ecr get-login-password --region eu-north-1 | sudo docker login --username AWS --password-stdin $REGISTRY
sudo docker pull $REGISTRY/job-tracker-server:v1

read -r -p "Endpoint: " DB_HOST
read -r -s -p "Password: " DB_PASS; echo
sudo install -m 600 /dev/null /etc/job-tracker.env
printf 'DATABASE_URL=postgresql://jobtracker:%s@%s:5432/jobtracker?sslmode=require\nJWT_SECRET=%s\n' "$DB_PASS" "$DB_HOST" "$(openssl rand -hex 48)" | sudo tee /etc/job-tracker.env > /dev/null
unset DB_PASS

sudo docker run --rm --env-file /etc/job-tracker.env $REGISTRY/job-tracker-server:v1 npx prisma migrate deploy
sudo docker run -d --name job-tracker-server --restart unless-stopped --env-file /etc/job-tracker.env -p 80:4000 $REGISTRY/job-tracker-server:v1
```

### 5. Check it

```bash
curl -s localhost/api/health; echo
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost/api/auth/login -H 'content-type: application/json' -d '{"email":"nobody@example.com","password":"wrong-password"}'
```

A `401` from the second command means the app reached the database. `500` means the connection failed. The `SECURITY WARNING` about SSL modes in the logs is expected.

### Shipping a new version later

1. On your PC, rebuild the image, then tag and push it as the next version (`v2`).
2. On the server, log Docker in again and run `docker pull` for `v2`.
3. Run the `migrate deploy` command with `v2`.
4. Run `sudo docker rm -f job-tracker-server`, then the `docker run -d` command with `v2`.

### Checklist

- [x] AWS CLI signed in as `huma-admin`
- [x] Image `job-tracker-server:v1` is in ECR
- [x] `job-tracker-server` EC2 instance is running with the `job-tracker-ec2-role` role
- [x] Migrations applied to RDS
- [x] Container running; health check OK and login test returns 401
