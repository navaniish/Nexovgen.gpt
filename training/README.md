# NexovGen GPT Training Codebase

This directory contains the production-grade training implementation for NexovGen GPT (7B).

## Architecture
- **Model:** Decoder-only Transformer based on Llama architecture.
- **Features:** RMSNorm, RoPE, SwiGLU, and FlashAttention-2 support.
- **Distributed:** Support for DDP and DeepSpeed ZeRO-3 via `torch.distributed`.

## Directory Structure
- `config.py`: Hyperparameters for 7B/70B scaling.
- `model.py`: Core Transformer implementation.
- `dataset.py`: Memory-mapped data loader for large-scale pretraining.
- `train.py`: Main entry point for distributed training.

## Usage

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch Distributed Training (512 GPUs example)
Note: Requires SLURM or torchrun.

```bash
torchrun --nproc_per_node=8 --nnodes=64 \
    --rdzv_id=unique_job_id --rdzv_backend=c10d \
    --rdzv_endpoint=$MASTER_ADDR:$MASTER_PORT \
    train.py
```

## Hardware Requirements
- NVIDIA A100 80GB or H100.
- InfiniBand HDR/NDR networking.
- High-throughput parallel dynamic storage (Lustre/WEKA).
