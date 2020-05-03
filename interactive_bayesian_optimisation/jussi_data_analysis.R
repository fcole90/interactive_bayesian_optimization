library(dplyr)
library(tidyverse)
library(lme4)
library(lmerTest)


options(scipen=999)
plots_dir = "instance/plots/final_study_2019/jussi_r_script/"
dataset_path = "instance/plots/final_study_2019/dataset_comparison_ready.csv"


data <- read.table(dataset_path, header = T, sep = ",") %>%
    filter(user_id > 0) %>%
    mutate(score_d = user_score - naive_bo_score) %>%
    mutate(trial = session,
           session = study_name,
           gp.experienced = ifelse(How.much.are.you.familiar.with.Gaussian.Processes..GP.. > 3, 1, 0)) %>%
    select(user_id, session, trial, gp.experienced, score_d, user_score, naive_bo_score, iteration)

## Show score per iteration per trial between sessions.
ggplot(data %>%
       group_by(session, iteration, trial) %>%
       summarise(score_d = mean(score_d)),
       aes(iteration, score_d)) +
    geom_point() +
    geom_smooth() +
    facet_grid(session ~ trial)

## Compare experts to naives.
ggplot(data %>%
       group_by(session, iteration, trial, gp.experienced) %>%
       summarise(score_d = mean(score_d)),
       aes(iteration, score_d, colour = factor(gp.experienced))) +
    geom_point() +
    geom_smooth() +
    facet_grid(session ~ trial)

data.best <- data %>% group_by(session, trial, gp.experienced, user_id) %>%
    select(user_id, session, trial, gp.experienced, score_d, iteration) %>%
    filter(score_d == max(score_d)) %>%
    filter(iteration == min(iteration))

ggplot(data.best %>% group_by(session, trial, gp.experienced) %>%
       mutate(score_d = mean(score_d),
              iteration = mean(iteration)),
       aes(iteration, fill = factor(gp.experienced))) +
    geom_density(alpha = 0.5) +
    facet_grid(. ~ session)

ggplot(data.best %>% group_by(session, trial, gp.experienced) %>%
       mutate(score_d = mean(score_d),
              iteration = mean(iteration)),
       aes(score_d, fill = factor(gp.experienced))) +
    geom_density(alpha = 0.5) +
    facet_grid(. ~ session)


## Test hypotheses about the role of session and gp experience in max
## achieved diff score and the time of achieving that.

summary(lmer(score_d ~ session + (1 | user_id), data = data.best))
summary(lmer(iteration ~ session + (1 | user_id), data = data.best))
summary(lmer(score_d ~ gp.experienced + (1 | user_id), data = data.best))
summary(lmer(iteration ~ gp.experienced + (1 | user_id), data = data.best))


# --->>> Second start

## Compare agents.
data.agents <- read.table(dataset_path, header = T, sep = ",") %>%
    filter(user_id > 0) %>%
    mutate(score_d = user_score - naive_bo_score) %>%
    mutate(trial = session,
           session = study_name,
           gp.experienced = ifelse(How.much.are.you.familiar.with.Gaussian.Processes..GP.. > 3, 1, 0)) %>%
    select(user_id, session, trial, gp.experienced, score_d, user_score, naive_bo_score, iteration) %>%
    gather("agent", "score2", user_score:naive_bo_score) %>%
    mutate(agent = factor(ifelse(agent == "user_score", "user", "machine")))


# Plot user and machine performance, each on a separate trial (form. session), averaged over users
ggplot(data.agents %>%
       group_by(session, iteration, trial, agent) %>%
       summarise(score = mean(score)) %>%
       group_by(session, iteration, agent) %>%
       summarise(score = mean(score)),
       aes(iteration, score, colour = factor(agent))) +
    geom_point() +
    geom_smooth() +
    facet_grid(. ~ session)
ggsave("user_vs_machine.png",
       plot = last_plot(), 
       device = "png", 
       path = plots_dir,
  )

## Humans are better than machines. Difference is significant, and
## also interaction between human and iteration is significant.
ggplot(data.agents %>%
       group_by(session, iteration, trial, agent) %>%
       summarise(score = mean(score)) %>%
       group_by(session, iteration, agent) %>%
       summarise(score = mean(score)),
       aes(iteration, score, colour = factor(agent))) +
    geom_point() +
    geom_smooth() +
    facet_grid(. ~ session)

ggplot(data.agents %>%
       mutate(agent = (ifelse(agent == "user" & gp.experienced == 1, "expert human",
                       ifelse(agent == "user" & gp.experienced == 0, "novice human",
                       ifelse(agent == "machine" & gp.experienced == 0, "machine",
                       ifelse(agent == "machine" & gp.experienced == 1, "machine",0)))))) %>%
       group_by(session, iteration, trial, agent) %>%
       summarise(score = mean(score)) %>%
       group_by(session, iteration, agent) %>%
       summarise(score = mean(score)),
       aes(iteration, score, colour = factor(agent))) +
    geom_point() +
    geom_smooth() +
    facet_grid(. ~ session)
ggsave("experts_vs_novice_vs_machines.png",
       plot = last_plot(), 
       device = "png", 
       path = plots_dir,
  )



# Test hypothesis that humans are better overall. Also check effect size.
summary(lmer(score ~ agent + (1 | user_id), data = data.agents))

summary(lmer(scale(score) ~ agent + (1 | user_id), data = data.agents))

# Without trial information.
summary(lmer(scale(score) ~ agent + (1 | user_id), data = data.agents %>%
                                                        group_by(session, user_id, iteration, trial, agent) %>%
                                                        summarise(score = mean(score)) %>%
                                                        group_by(session, user_id, iteration, agent) %>%
                                                        summarise(score = mean(score))))

# Without trial and iteration information.
summary(lmer((score) ~ agent + (1 | user_id), data = data.agents %>%
                                                   group_by(session, user_id, iteration, trial, agent) %>%
                                                   summarise(score = mean(score)) %>%
                                                   group_by(session, user_id, iteration, agent) %>%
                                                   summarise(score = mean(score)) %>%
                                                   group_by(session, user_id, agent) %>%
                                                   summarise(score = mean(score))))



# Nested random structure.
summary(lmer(score ~ agent + (user_id | iteration), data = data.agents))

# Test interaction between agent and iteration: with humans, iteration
# contributes more to score.
summary(lmer(score ~ agent*iteration + (1 | user_id), data = data.agents))

summary(lmer(score ~ agent*iteration + gp.experienced*iteration + (1 | user_id), data = data.agents))

summary(lmer(score ~ agent*gp.experienced*iteration + (1 | user_id), data = data.agents))

## Test the impact of human expertise.
summary(lmer(score ~ gp.experienced + (1 | user_id),
             data = data.agents %>% filter(agent == "user")))

summary(lmer(score ~ gp.experienced + (1 | user_id) + (1 | trial),
             data = data.agents %>% filter(agent == "user")))

summary(lmer(score ~ iteration*gp.experienced + (1 | user_id),
             data = data.agents %>% filter(agent == "user")))


## Test if machines are experts :-)
summary(lmer(score ~ gp.experienced + (1 | user_id),
             data = data.agents %>% filter(agent == "machine")))

# Plot a comparison between machines on their experience
ggplot(data.agents %>%
       filter(agent == "machine") %>%
       group_by(session, iteration, trial, gp.experienced) %>%
       summarise(score = mean(score)) %>%
       group_by(session, iteration, gp.experienced) %>%
       summarise(score = mean(score)),
       aes(iteration, score, colour = factor(gp.experienced))) +
    geom_point() +
    geom_smooth() +
    facet_grid(. ~ session)



# --->>> Third start: Actual steering

## Compare agents.
data.agents <- read.table(dataset_path, header = T, sep = ",") %>%
    filter(user_id > 0) %>%
    mutate(score_d = user_score - naive_bo_score) %>%
    mutate(trial = session,
           session = study_name,
           gp.experienced = ifelse(How.much.are.you.familiar.with.Gaussian.Processes..GP.. > 3, 1, 0)) %>%
    select(user_id, session, trial, gp.experienced, score_d, user_score, naive_bo_score, iteration, scaled_steering) %>%
    gather("agent", "score", user_score:naive_bo_score) %>%
    mutate(agent = factor(ifelse(agent == "user_score", "user", "machine")))

# Get abs mean steer by user ID
data.agents.steer.mean = data.agents %>%
       group_by(user_id) %>%
       summarise(user_mean_steer = mean(abs(scaled_steering)))

# Merge back in the original dataset and mark as steerer if steering is higher than average
data.agents = merge(data.agents, data.agents.steer.mean) %>%
    mutate(is_steerer = ifelse(user_mean_steer > mean(abs(data.agents$scaled_steering)), T, F))


count(data.agents, is_steerer)

# hist(abs(data.agents$scaled_steering))

# Density plot of absolute steering
ggplot(data.agents, aes(x = abs(data.agents$scaled_steering))) +
  geom_density() +
  xlab("level of steering") +
  ggtitle("Density of steering in all responses") +
  theme(plot.title = element_text(hjust = 0.5))
ggsave("steering_dist_all_responses.png",
       plot = last_plot(), 
       device = "png", 
       path = plots_dir
)

count(data.agents, abs(scaled_steering) < 0.1) / 100
count(data.agents.steer.mean, user_mean_steer < 1)
min(data.agents.steer.mean$user_mean_steer)
data.agents.steer.mean[data.agents.steer.mean$user_mean_steer < 1,]
mean(abs(data.agents$scaled_steering))

mode <- function(v) {
  uniqv <- unique(v)
  uniqv[which.max(tabulate(match(v, uniqv)))]
}

mode(abs(data.agents$scaled_steering))

sd(abs(data.agents$scaled_steering))


# Density plot of average user absolute steering
ggplot(data.agents.steer.mean, aes(x = user_mean_steer)) +
  geom_histogram() +
  xlab("level of steering") +
  ggtitle("Density of steering") +
  theme(plot.title = element_text(hjust = 0.5))

png("instance/plots/final_study_2019/jussi_r_script/hist_user_steering.png")
hist(data.agents.steer.mean$user_mean_steer,
     xlab="Average steering among users",
     main="Histogram of users average steering",
     breaks = 50
     )
dev.off()
ggsave("hist_user_steering.png",
       plot = last_plot(), 
       device = "png", 
       path = plots_dir
)



# Compare user steerer to non-steerer to machines
ggplot(data.agents %>%
       mutate(agent = (ifelse(agent == "user" & is_steerer == T, "steerer human",
                       ifelse(agent == "user" & is_steerer == F, "non-steerer human",
                       ifelse(agent == "machine" & is_steerer == F, "machine",
                       ifelse(agent == "machine" & is_steerer == T, "machine",0)))))) %>%
       group_by(session, iteration, trial, agent) %>%
       summarise(score = mean(score)) %>%
       group_by(session, iteration, agent) %>%
       summarise(score = mean(score)),
       aes(iteration, score, colour = factor(agent))) +
    geom_point() +
    geom_smooth() +
    facet_grid(. ~ session)
ggsave("steerer_non-steerer_vs_machines.png",
       plot = last_plot(), 
       device = "png", 
       path = plots_dir,
  )


mean_abs_steer = mean(abs(data.agents$scaled_steering))
# Compare user steerer to non-steerer to machines
ggplot(data.agents %>%
         mutate(trial_type = (ifelse(agent == "user" & abs(scaled_steering) > mean(abs(data.agents$scaled_steering)), "steering",
                              ifelse(agent == "user" & abs(scaled_steering) <= mean(abs(data.agents$scaled_steering)), "non-steerering",
                              ifelse(agent == "machine", "machine", 0))))) %>%
         group_by(session, iteration, trial, trial_type, agent) %>%
         summarise(score = mean(score)) %>%
         group_by(session, iteration, trial_type, agent) %>%
         summarise(score = mean(score)),
       aes(iteration, score, colour = factor(trial_type))) +
  geom_point() +
  geom_smooth() +
  facet_grid(. ~ session)
ggsave("trials_steering_vs_non-steerer_vs_machines.png",
       plot = last_plot(), 
       device = "png", 
       path = plots_dir,
)


## Test the impact of human steering
summary(lmer(score ~ iteration*is_steerer + (1 | user_id),
             data = data.agents %>% filter(agent == "user")))


## Test if machines are steerers :-)
summary(lmer(score ~ is_steerer + (1 | user_id),
             data = data.agents %>% filter(agent == "machine")))

ggplot(data.agents %>%
       filter(agent == "machine") %>%
       group_by(session, iteration, trial, is_steerer) %>%
       summarise(score = mean(score)) %>%
       group_by(session, iteration, is_steerer) %>%
       summarise(score = mean(score)),
       aes(iteration, score, colour = factor(is_steerer))) +
    geom_point() +
    geom_smooth() +
    facet_grid(. ~ session)