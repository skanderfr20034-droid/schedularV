"""
Configuration settings for SchedulingTransformer.
Educational model for multi-agent negotiation via Transformer attention.
"""

# Model Architecture
#MODEL_DIM = 64  # Embedding dimension (small for educational purpose)
#NUM_HEADS = 4  # Number of attention heads
#NUM_LAYERS = 3  # Number of transformer layers = number of negotiation rounds
#FEEDFORWARD_DIM = 256  # Hidden dimension in feedforward layers
#DROPOUT = 0.1  # Dropout rate

# Training
#BATCH_SIZE = 32
#LEARNING_RATE = 0.001
#NUM_EPOCHS = 50
#WEIGHT_DECAY = 1e-5

MODEL_DIM = 32
NUM_HEADS = 4
NUM_LAYERS = 3
FEEDFORWARD_DIM = 128
DROPOUT = 0.1

BATCH_SIZE = 8
LEARNING_RATE = 0.001
NUM_EPOCHS = 8
WEIGHT_DECAY = 1e-5





# Dataset Generation
NUM_ROOMS = 5
ROOM_CAPACITY_RANGE = (20, 100)
AVAILABLE_HOURS = 8  # Number of available time slots (e.g., 8AM to 4PM)
AVAILABLE_DAYS = 5  # Business days (Mon-Fri)

NUM_PREFERRED_SLOTS_TEACHER = 2
NUM_UNAVAILABLE_SLOTS_TEACHER = 2
NUM_PREFERRED_SLOTS_STUDENT = 2

# Satisfaction Thresholds
SATISFACTION_THRESHOLD = 0.7

# API
API_HOST = "0.0.0.0"
API_PORT = 8000
DEBUG = True

# Random Seed
SEED = 42
