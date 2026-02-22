# Charge Alerts Pi Config

Sets up a Pi5 as a Noisebridge charge alerts kiosk display driver.

## Prerequisites

- Ansible installed on your local machine
- SSH access to the target Pi as user `noisebridge`

## Usage

Provision a host:

```bash
cd ansible
ansible-playbook provision.yml --limit charge-alerts2 -e kiosk_http_user=$USER -e kiosk_http_pass=$PASS
```

Dry run (check mode):

```bash
cd ansible
ansible-playbook provision.yml --limit charge-alerts2 -e kiosk_http_user=$USER -e kiosk_http_pass=$PASS --check --diff
```

## Adding a new host

Add an entry to `ansible/inventory.yml`:

```yaml
all:
  hosts:
    charge-alerts4:
      ansible_host: charge-alerts4.local
```
