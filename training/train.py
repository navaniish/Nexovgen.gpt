import os
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from model import Transformer
from config import NexovGenConfig
from dataset import get_dataloader
import time

def setup_dist():
    if 'RANK' in os.environ:
        rank = int(os.environ['RANK'])
        world_size = int(os.environ['WORLD_SIZE'])
        gpu = int(os.environ['LOCAL_RANK'])
    else:
        rank = 0
        world_size = 1
        gpu = 0
    
    torch.cuda.set_device(gpu)
    dist.init_process_group(backend='nccl', init_method='env://', world_size=world_size, rank=rank)
    return rank, world_size, gpu

def train():
    rank, world_size, gpu = setup_dist()
    config = NexovGenConfig()
    
    # Initialize Model
    model = Transformer(config).cuda()
    model = DDP(model, device_ids=[gpu])
    
    # Optimizer
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.lr,
        betas=(config.adam_beta1, config.adam_beta2),
        eps=config.adam_eps,
        weight_decay=config.weight_decay
    )
    
    # Dataset
    dataloader = get_dataloader(
        "data/corpus.bin", 
        config.max_seq_len, 
        config.max_batch_size,
        world_size=world_size,
        rank=rank
    )
    
    model.train()
    start_time = time.time()
    
    for epoch in range(1):
        for step, (x, y) in enumerate(dataloader):
            x, y = x.cuda(), y.cuda()
            
            optimizer.zero_grad()
            
            # Forward
            logits = model(x, 0)
            loss = torch.nn.functional.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))
            
            # Backward
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            
            if rank == 0 and step % 10 == 0:
                dt = time.time() - start_time
                start_time = time.time()
                print(f"Step {step}: Loss {loss.item():.4f} | throughput: {config.max_batch_size * world_size / dt:.2f} samples/sec")
                
            if rank == 0 and step % 1000 == 0:
                torch.save(model.module.state_dict(), f"checkpoints/nexovgen_7b_step_{step}.pt")

    dist.destroy_process_group()

if __name__ == "__main__":
    train()
