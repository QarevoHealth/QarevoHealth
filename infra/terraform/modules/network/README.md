# Network Module

## Description
This module provisions the core VPC infrastructure for QarevoHealth, including Public and Private subnets across multiple Availability Zones. It is designed to be EKS-ready with appropriate ELB tagging.

## Features
- **VPC** with DNS Hostnames/Support enabled.
- **Public Subnets** for Load Balancers (tagged for External ELBs).
- **Private Subnets** for App/DB/EKS Nodes (tagged for Internal ELBs).
- **NAT Gateway** for outbound traffic from private tiers.
- **Internet Gateway** for public tier access.

## Inputs
| Name | Description | Type | Default |
| :--- | :--- | :--- | :--- |
| `project` | Project name prefix | `string` | - |
| `env` | Environment (dev/staging/prod) | `string` | - |
| `cidr` | VPC CIDR block | `string` | `10.0.0.0/16` |
| `az_count` | Number of AZs to utilize | `number` | `2` |

## Outputs
| Name | Description |
| :--- | :--- |
| `vpc_id` | The ID of the created VPC |
| `public_subnet_ids` | List of Public Subnet IDs |
| `private_subnet_ids` | List of Private Subnet IDs |